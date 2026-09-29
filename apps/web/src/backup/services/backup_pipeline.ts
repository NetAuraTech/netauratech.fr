import {
	mkdir as defaultMkdir,
	stat as defaultStat,
	unlink as defaultUnlink,
	writeFile as defaultWriteFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { BackupMetadata } from '#backup/domain/backup';
import { createDatabaseDump as defaultCreateDatabaseDump, type DumpOptions } from '#backup/services/dump_helper';
import { SnapshotHelper, type SnapshotHelper as SnapshotHelperType } from '#backup/services/snapshot_helper';
import { StorageUploader, type StorageUploader as StorageUploaderType } from '#backup/services/storage_uploader';
import backupConfig from '#config/backup';
import { type LogService } from '#log/services/log_service';
import { LogCategory } from '#log/types/logging';
import env from '#start/env';
import type { BackupResult, BackupContext } from '#backup/types/backup';

/**
 * Test-override dependency-injection bag for the backup pipeline.
 *
 * Declared exactly once here; the {@link BackupPipeline} constructor and the
 * tests are its only consumers. Keys prefixed with `_` are internal: in
 * production
 * the bag is omitted and every dependency falls back to its real
 * implementation; in tests, stubs replace the real functions so no ESM-level
 * mocking is needed.
 */
export interface BackupPipelineOverrides {
	_snapshotHelper?: SnapshotHelperType;
	_uploader?: StorageUploaderType;
	_mkdir?: typeof defaultMkdir;
	_stat?: typeof defaultStat;
	_unlink?: typeof defaultUnlink;
	_writeFile?: typeof defaultWriteFile;
	_createDatabaseDump?: (options: DumpOptions, _spawn?: any) => Promise<void>;
}

/**
 * BackupPipeline - the single execution path for every backup kind.
 *
 * Owns the dump, compress, encrypt, manifest, upload and cleanup steps for
 * both full and differential backups: temp-file tracking and cleanup,
 * result-object construction and pipeline logging. Full backups run through
 * {@link executeFullBackup}; differential backups through
 * {@link executeDifferentialBackup}. The only variation point between the
 * two runs is table selection: every table for a full dump, the tables
 * modified since the last full backup for a differential one. When no full
 * backup exists to serve as the base, the differential run falls back to a
 * full backup inside the pipeline.
 *
 * Non-DI class: imported and instantiated directly, no @inject().
 *
 * **Direct infra access** (exception to the layering rules)
 *
 * A backup is OS-level work no repository can own: a `pg_dump` child
 * process, gzip compression and encryption, temp-file handling on the
 * filesystem, and raw SQL against the catalogs (`pg_stat_user_tables`,
 * `information_schema`) to detect modified tables. The pipeline therefore
 * bypasses the repository layer entirely.
 *
 * **Dependency injection for testability**
 *
 * The optional `overrides` bag accepts dependencies prefixed with `_` to
 * distinguish them from public API parameters. In production, the bag is
 * never passed and each dependency falls back to its real implementation
 * (e.g. `mkdir as defaultMkdir`). In tests, stubs replace the real functions
 * so no ESM-level mocking is needed.
 *
 * @example Production usage
 *   new BackupPipeline(context, logService)
 *
 * @example Test usage
 *   new BackupPipeline(context, logService, {
 *     _snapshotHelper: snapshotMock,
 *     _mkdir: mkdirStub,
 *   })
 */
export class BackupPipeline {
	private readonly snapshotHelper: SnapshotHelperType;
	private readonly storageUploader: StorageUploaderType;
	private readonly mkdirFn: typeof defaultMkdir;
	private readonly statFn: typeof defaultStat;
	private readonly unlinkFn: typeof defaultUnlink;
	private readonly writeFileFn: typeof defaultWriteFile;
	private readonly createDump: (options: DumpOptions, _spawn?: any) => Promise<void>;
	private readonly tempFiles: string[] = [];

	/**
	 * @param context - Backup execution context (temp dir, filename, strategy type).
	 * @param logService - Application logging service.
	 * @param overrides - Optional dependency overrides for testing (see
	 *   {@link BackupPipelineOverrides}). Kept so a fallback run started
	 *   inside {@link executeDifferentialBackup} inherits the same stubs.
	 */
	constructor(
		private readonly context: BackupContext,
		private readonly logService: LogService,
		private readonly overrides?: BackupPipelineOverrides,
	) {
		this.snapshotHelper = overrides?._snapshotHelper ?? new SnapshotHelper();
		this.storageUploader = overrides?._uploader ?? new StorageUploader();
		this.mkdirFn = overrides?._mkdir ?? defaultMkdir;
		this.statFn = overrides?._stat ?? defaultStat;
		this.unlinkFn = overrides?._unlink ?? defaultUnlink;
		this.writeFileFn = overrides?._writeFile ?? defaultWriteFile;
		this.createDump = overrides?._createDatabaseDump ?? defaultCreateDatabaseDump;
	}

	/**
	 * Local path of the SQL dump for the pipeline's backup filename: the
	 * trailing `.sql`/`.gz`/`.enc` extension stack reduced to a single `.sql`.
	 */
	dumpPath(): string {
		return join(this.context.tempDir, this.context.filename).replace(/(\.sql|\.gz|\.enc)+$/, '.sql');
	}

	/**
	 * Run a strategy-specific pipeline body inside the shared envelope.
	 *
	 * Logs the start of the run, ensures the temp directory exists, executes
	 * the body with an `elapsed()` helper, turns any failure into a failure
	 * {@link BackupResult}, and always cleans up tracked temp files.
	 *
	 * @param body - Strategy-specific steps (dump, manifest, upload, ...).
	 *   Receives `elapsed()` returning the milliseconds spent so far.
	 * @returns The {@link BackupResult} built by the body on success, or a
	 *   failure result when the body throws.
	 */
	async run(body: (elapsed: () => number) => Promise<BackupResult>): Promise<BackupResult> {
		const startTime = Date.now();
		this.logStart();

		try {
			await this.ensureTempDir();

			return await body(() => Date.now() - startTime);
		} catch (error) {
			return this.failureResult(error, Date.now() - startTime);
		} finally {
			await this.cleanupTemp();
		}
	}

	/**
	 * Execute a full backup end to end: dump every table, compress and
	 * encrypt the dump, upload the artifact, then persist a manifest listing
	 * the dumped tables.
	 *
	 * Entry point for full backups — the backup engine and the differential
	 * fallback both delegate here instead of a dedicated strategy module.
	 *
	 * @returns The {@link BackupResult} for the run.
	 */
	async executeFullBackup(): Promise<BackupResult> {
		return this.run(async (elapsed) => {
			const dumpPath = this.dumpPath();
			await this.dump(dumpPath);

			const { encryptedPath, size } = await this.compressAndEncrypt(dumpPath);
			await this.uploadBackup(encryptedPath);

			const tables = await this.getAllTables();
			await this.writeManifest({ tables });

			return this.successResult(size, elapsed());
		});
	}

	/**
	 * Execute a differential backup end to end: find the last full backup as
	 * the base reference, dump only the tables modified since then, compress
	 * and encrypt the dump, upload the artifact, then persist a manifest
	 * listing the dumped tables and referencing the base full backup filename.
	 *
	 * Entry point for differential backups. When no full backup exists, the
	 * run falls back to a full backup executed inside this same pipeline with
	 * a full-typed filename. When no table has been modified, the run is
	 * skipped and no artifact is produced.
	 *
	 * @returns The {@link BackupResult} for the run.
	 */
	async executeDifferentialBackup(): Promise<BackupResult> {
		return this.run(async (elapsed) => {
			// Find the last full backup to use as reference
			const lastFullBackup = await this.findLastFullBackup();
			if (!lastFullBackup) {
				this.logService.warn({
					message: 'No full backup found, running full backup instead',
					category: LogCategory.SYSTEM,
				});

				// Fall through to a full backup — regenerate the filename to match
				const fullContext: BackupContext = {
					...this.context,
					filename: BackupMetadata.generateFilename('full'),
					strategyType: 'full',
				};
				return new BackupPipeline(fullContext, this.logService, this.overrides).executeFullBackup();
			}

			// Get tables modified since the last backup
			const modifiedTables = await this.getModifiedTables(lastFullBackup.createdAt);

			if (modifiedTables.length === 0) {
				this.logService.info({
					message: 'No tables modified since last backup, skipping',
					category: LogCategory.SYSTEM,
				});
				return this.noArtifactResult(elapsed());
			}

			this.logService.info({
				message: 'Found modified tables',
				category: LogCategory.SYSTEM,
				metadata: { count: modifiedTables.length, tables: modifiedTables },
			});

			const dumpPath = this.dumpPath();
			await this.dump(dumpPath, modifiedTables);

			const { encryptedPath, size } = await this.compressAndEncrypt(dumpPath);
			await this.writeManifest({
				type: 'differential',
				tables: modifiedTables,
				fullBackupReference: lastFullBackup.filename,
			});
			await this.uploadBackup(encryptedPath);

			return this.successResult(size, elapsed());
		});
	}

	/**
	 * Execute `pg_dump` into the given output path, tracking the produced file
	 * for cleanup.
	 *
	 * @param outputPath - Local path to write the SQL dump to.
	 * @param tables - Optional tables to limit the dump to (differential backups).
	 */
	async dump(outputPath: string, tables?: string[]): Promise<void> {
		this.track(outputPath);
		await this.createDump({
			host: env.get('PG_HOST')!,
			port: Number(env.get('PG_PORT') || 5432),
			user: env.get('PG_USER')!,
			database: env.get('PG_DB_NAME')!,
			password: env.get('PG_PASSWORD').release(),
			outputPath,
			tables,
		});
	}

	/**
	 * Compress the SQL dump, encrypt it, and measure the resulting artifact.
	 *
	 * Tracks the compressed and final paths for cleanup and removes the raw
	 * dump once it has been compressed.
	 *
	 * @param dumpPath - Local path of the SQL dump produced by {@link dump}.
	 * @returns The final artifact path (encrypted when enabled, compressed
	 *   otherwise) and its size in bytes.
	 */
	async compressAndEncrypt(dumpPath: string): Promise<{ encryptedPath: string; size: number }> {
		const compressedPath = await this.snapshotHelper.compress(dumpPath);
		this.track(compressedPath);
		await this.unlinkFn(dumpPath);

		const encryptedPath = await this.snapshotHelper.encrypt(compressedPath);
		this.track(encryptedPath);

		const { size } = await this.statFn(encryptedPath);
		return { encryptedPath, size };
	}

	/**
	 * Upload the final backup artifact to storage under the pipeline's filename.
	 *
	 * @param finalPath - Local path of the artifact to upload.
	 */
	uploadBackup(finalPath: string): Promise<void> {
		return this.storageUploader.upload(finalPath, this.context.filename);
	}

	/**
	 * Serialize, write and upload the backup manifest, tracking it for cleanup.
	 *
	 * @param payload - Raw manifest content to persist as JSON.
	 * @returns The local path of the written manifest file.
	 */
	async writeManifest(payload: object): Promise<string> {
		const manifestFilename = BackupMetadata.manifestFilename(this.context.filename);
		const manifestPath = join(this.context.tempDir, manifestFilename);
		await this.writeFileFn(manifestPath, JSON.stringify(payload, null, 2));
		await this.storageUploader.upload(manifestPath, manifestFilename);
		this.track(manifestPath);
		return manifestPath;
	}

	/**
	 * Build the success {@link BackupResult} for a completed backup and log the
	 * completion with size and duration metadata.
	 *
	 * @param size - Size in bytes of the uploaded artifact.
	 * @param duration - Pipeline duration in milliseconds.
	 */
	successResult(size: number, duration: number): BackupResult {
		this.logService.info({
			message: 'Backup completed successfully',
			category: LogCategory.SYSTEM,
			metadata: { filename: this.context.filename, size, duration },
		});

		return {
			success: true,
			filename: this.context.filename,
			type: this.context.strategyType,
			size,
			duration,
			storage: backupConfig.storage.disk,
		};
	}

	/**
	 * Build the success {@link BackupResult} for a run that produced no
	 * artifact (e.g. a differential backup skipped because nothing changed).
	 *
	 * @param duration - Pipeline duration in milliseconds.
	 */
	noArtifactResult(duration: number): BackupResult {
		return {
			success: true,
			filename: '',
			type: this.context.strategyType,
			size: 0,
			duration,
			storage: backupConfig.storage.disk,
		};
	}

	/**
	 * List all tables in the `public` schema (persisted in the manifest by
	 * {@link executeFullBackup}).
	 */
	private async getAllTables(): Promise<string[]> {
		const db = await import('@adonisjs/lucid/services/db');
		const connection = db.default.connection(backupConfig.database.connection);
		const result = await connection.rawQuery(
			`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
		);
		return result.rows.map((row: any) => row.tablename);
	}

	/**
	 * Find the newest full backup stored on the configured disk — the base
	 * reference for a differential run ({@link executeDifferentialBackup}).
	 */
	private async findLastFullBackup(): Promise<BackupMetadata | null> {
		const backups = await this.listBackups();
		const fullBackups = backups.filter((b) => b.type === 'full');
		return fullBackups.length > 0 ? fullBackups[0] : null;
	}

	/**
	 * List the backup artifacts stored under the configured prefix, newest
	 * first. Storage failures are logged and swallowed as an empty list,
	 * which makes a differential run fall back to a full backup.
	 */
	private async listBackups(): Promise<BackupMetadata[]> {
		try {
			const objects = await this.storageUploader.listBackups();
			const backups: BackupMetadata[] = [];

			for (const object of objects) {
				if (object.isDirectory) continue;

				const filename = object.key.replace(backupConfig.storage.prefix + '/', '');
				const meta = await this.storageUploader.getMetaData(object.key);
				const backup = BackupMetadata.fromStorageObject(filename, meta, object.key);
				if (!backup) continue;

				backups.push(backup);
			}

			return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
		} catch (error) {
			this.logService.error({
				message: 'Failed to list backups from Drive',
				category: LogCategory.SYSTEM,
				error,
				context: { disk: backupConfig.storage.disk },
			});
			return [];
		}
	}

	/**
	 * List the tables modified since the given date, combining vacuum/analyze
	 * statistics with `updated_at` columns (excluding the tables listed in the
	 * differential config exclusions).
	 *
	 * @param since - Reference date (creation time of the base full backup).
	 */
	private async getModifiedTables(since: Date): Promise<string[]> {
		const db = await import('@adonisjs/lucid/services/db');
		const connection = db.default.connection(backupConfig.database.connection);

		const result = await connection.rawQuery(
			`
        SELECT
          schemaname || '.' || relname as table_name,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE
          schemaname = 'public'
          AND (
            last_vacuum > ? OR
            last_autovacuum > ? OR
            last_analyze > ? OR
            last_autoanalyze > ?
          )
        ORDER BY relname
      `,
			[since, since, since, since],
		);

		const modifiedFromStats = result.rows.map((row: any) => row.table_name.replace('public.', ''));

		const allTablesResult = await connection.rawQuery(
			`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
		);
		const allTables = allTablesResult.rows.map((row: any) => row.tablename);

		const modifiedFromUpdatedAt: string[] = [];

		for (const table of allTables) {
			if (backupConfig.differential.excludedTables.includes(table)) continue;

			try {
				const hasUpdatedAt = await connection.rawQuery(
					`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = ?
              AND column_name = 'updated_at'
          `,
					[table],
				);

				if (hasUpdatedAt.rows.length > 0) {
					const hasModified = await connection.rawQuery(`SELECT 1 FROM "${table}" WHERE updated_at > ? LIMIT 1`, [
						since,
					]);
					if (hasModified.rows.length > 0) {
						modifiedFromUpdatedAt.push(table);
					}
				}
			} catch (error) {
				this.logService.warn({
					message: 'Failed to check table for modifications',
					category: LogCategory.SYSTEM,
					error,
					metadata: { table },
				});
			}
		}

		return [...new Set([...modifiedFromStats, ...modifiedFromUpdatedAt])];
	}

	/**
	 * Create the temp directory for the pipeline (recursively).
	 */
	private async ensureTempDir(): Promise<void> {
		await this.mkdirFn(this.context.tempDir, { recursive: true });
	}

	/**
	 * Track a temporary file for removal by {@link cleanupTemp}.
	 */
	private track(path: string): void {
		this.tempFiles.push(path);
	}

	/**
	 * Remove every tracked temp file, silently ignoring missing ones.
	 *
	 * Runs after success or failure alike: temp files must never leak out of
	 * a pipeline run.
	 */
	private async cleanupTemp(): Promise<void> {
		for (const path of this.tempFiles) {
			try {
				await this.unlinkFn(path);
			} catch {
				// File already gone - no-op
			}
		}
	}

	/**
	 * Log the start of a pipeline run.
	 */
	private logStart(): void {
		this.logService.info({
			message: `Starting ${this.context.strategyType} backup`,
			category: LogCategory.SYSTEM,
			metadata: { filename: this.context.filename },
		});
	}

	/**
	 * Build the failure {@link BackupResult} for a run that threw and log the
	 * failure.
	 *
	 * @param error - The error thrown by the pipeline body.
	 * @param duration - Pipeline duration in milliseconds.
	 */
	private failureResult(error: any, duration: number): BackupResult {
		this.logService.error({
			message: `${this.strategyLabel} backup failed`,
			category: LogCategory.SYSTEM,
			error,
			context: { filename: this.context.filename, duration },
		});

		return {
			success: false,
			filename: this.context.filename,
			type: this.context.strategyType,
			size: 0,
			duration,
			storage: backupConfig.storage.disk,
			error: error.message,
		};
	}

	/**
	 * Title-cased strategy label used in log messages
	 * ('Full' / 'Differential').
	 */
	private get strategyLabel(): string {
		return this.context.strategyType === 'full' ? 'Full' : 'Differential';
	}
}
