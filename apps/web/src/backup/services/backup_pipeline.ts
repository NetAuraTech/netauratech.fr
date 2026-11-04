import {
	mkdir as defaultMkdir,
	readFile as defaultReadFile,
	stat as defaultStat,
	unlink as defaultUnlink,
	writeFile as defaultWriteFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { DateTime } from 'luxon';
import { BackupMetadata } from '#backup/domain/backup';
import { createDatabaseDump as defaultCreateDatabaseDump, type DumpOptions } from '#backup/services/dump_helper';
import { restoreDatabaseWithPsql, type PsqlRestoreOptions } from '#backup/services/psql_helper';
import {
	MANAGED_SCHEMAS,
	generateRestorePrelude,
	makeDumpIdempotent,
	quoteLiteral,
	type RestorePreludeInput,
} from '#backup/services/restore_helper';
import { SnapshotHelper, type SnapshotHelper as SnapshotHelperType } from '#backup/services/snapshot_helper';
import { StorageUploader, type StorageUploader as StorageUploaderType } from '#backup/services/storage_uploader';
import backupConfig from '#config/backup';
import { type LogService } from '#log/services/log_service';
import { LogCategory } from '#log/types/logging';
import env from '#start/env';
import type {
	BackupContext,
	BackupManifest,
	BackupResult,
	BackupStrategy,
	BackupType,
	RestoreResult,
} from '#backup/types/backup';

/**
 * Test-override dependency-injection bag for the backup pipeline.
 *
 * Declared exactly once here; the {@link BackupPipeline} constructor and the
 * tests are its only consumers. Keys prefixed with `_` are internal: in
 * production the bag is omitted and every dependency falls back to its real
 * implementation; in tests, stubs replace the real functions so no ESM-level
 * mocking is needed.
 */
export interface BackupPipelineOverrides {
	_snapshotHelper?: SnapshotHelperType;
	_uploader?: StorageUploaderType;
	_mkdir?: typeof defaultMkdir;
	_readFile?: typeof defaultReadFile;
	_stat?: typeof defaultStat;
	_unlink?: typeof defaultUnlink;
	_writeFile?: typeof defaultWriteFile;
	_createDatabaseDump?: (
		options: DumpOptions,
		_spawn?: any,
		_sanitize?: (path: string) => Promise<void>,
	) => Promise<void>;
	_restoreDatabase?: (options: PsqlRestoreOptions) => Promise<void>;
}

/**
 * BackupPipeline - the single public face of the backup domain.
 *
 * Exposes three entry points: {@link run} for executing a backup (full or
 * differential), {@link restore} for restoring a database from a stored
 * artifact, and {@link list} for enumerating stored artifacts. Everything
 * else — strategy resolution, temp-file tracking, result construction,
 * pipeline logging — is private.
 *
 * Non-DI class: imported and instantiated directly, no @inject().
 *
 * **Direct infra access** (exception to the layering rules)
 *
 * A backup is OS-level work no repository can own: a `pg_dump` child
 * process, gzip compression and encryption, temp-file handling on the
 * filesystem, and raw SQL against the catalogs to detect modified tables.
 * The pipeline therefore bypasses the repository layer entirely.
 *
 * **Dependency injection for testability**
 *
 * The optional `overrides` bag accepts dependencies prefixed with `_` to
 * distinguish them from public API parameters. In production, the bag is
 * never passed and each dependency falls back to its real implementation.
 * In tests, stubs replace the real functions so no ESM-level mocking is
 * needed.
 *
 * @example Production usage
 *   new BackupPipeline(logService)
 *
 * @example Test usage
 *   new BackupPipeline(logService, {
 *     _snapshotHelper: snapshotMock,
 *     _mkdir: mkdirStub,
 *   })
 */
export class BackupPipeline {
	private readonly snapshotHelper: SnapshotHelperType;
	private readonly storageUploader: StorageUploaderType;
	private readonly mkdirFn: typeof defaultMkdir;
	private readonly readFileFn: typeof defaultReadFile;
	private readonly statFn: typeof defaultStat;
	private readonly unlinkFn: typeof defaultUnlink;
	private readonly writeFileFn: typeof defaultWriteFile;
	private readonly createDump: (
		options: DumpOptions,
		_spawn?: any,
		_sanitize?: (path: string) => Promise<void>,
	) => Promise<void>;
	private readonly restoreDatabaseFn: (options: PsqlRestoreOptions) => Promise<void>;
	private readonly tempFiles: string[] = [];

	/**
	 * @param logService - Application logging service.
	 * @param overrides - Optional dependency overrides for testing (see
	 *   {@link BackupPipelineOverrides}).
	 */
	constructor(
		private readonly logService: LogService,
		overrides?: BackupPipelineOverrides,
	) {
		this.snapshotHelper = overrides?._snapshotHelper ?? new SnapshotHelper();
		this.storageUploader = overrides?._uploader ?? new StorageUploader();
		this.mkdirFn = overrides?._mkdir ?? defaultMkdir;
		this.readFileFn = overrides?._readFile ?? defaultReadFile;
		this.statFn = overrides?._stat ?? defaultStat;
		this.unlinkFn = overrides?._unlink ?? defaultUnlink;
		this.writeFileFn = overrides?._writeFile ?? defaultWriteFile;
		this.createDump = overrides?._createDatabaseDump ?? defaultCreateDatabaseDump;
		this.restoreDatabaseFn = overrides?._restoreDatabase ?? restoreDatabaseWithPsql;
	}

	/**
	 * Local path of the SQL dump for the given backup filename: the trailing
	 * `.sql`/`.gz`/`.enc` extension stack reduced to a single `.sql`.
	 */
	dumpPath(filename: string): string {
		return join(backupConfig.tempDir, filename).replace(/(\.sql|\.gz|\.enc)+$/, '.sql');
	}

	/**
	 * Run a backup: resolve the strategy, build the execution context, and
	 * execute the appropriate pipeline body inside the shared envelope.
	 *
	 * @param strategy - Backup strategy: an explicit kind, or `auto` to
	 *   follow the configured schedule.
	 * @returns The {@link BackupResult} for the run.
	 */
	async run(strategy: BackupStrategy = 'auto'): Promise<BackupResult> {
		const type = this.resolveStrategy(strategy);
		const context: BackupContext = {
			tempDir: backupConfig.tempDir,
			filename: BackupMetadata.generateFilename(type),
			strategyType: type,
		};

		return this.runEnvelope(
			context,
			type === 'full' ? () => this.executeFullBackup(context) : () => this.executeDifferentialBackup(context),
		);
	}

	/**
	 * Restore a database from a stored backup artifact: verify the artifact
	 * exists, download it, decrypt and decompress it, then replay the SQL
	 * dump through `psql`. The dump is made idempotent and a reset prelude
	 * is generated and replayed first, so the restore works against a
	 * database that is not empty (see {@link buildRestorePrelude} and
	 * {@link makeDumpIdempotent}). All intermediate files are cleaned up
	 * after the restore, whether it succeeds or fails.
	 *
	 * @param filename - The backup artifact filename (relative to the storage
	 *   prefix).
	 * @returns A success/failure result with an optional error message, and
	 *   the error's code when the failure carries one (e.g. a missing or
	 *   malformed differential manifest).
	 */
	async restore(filename: string): Promise<RestoreResult> {
		const exists = await this.storageUploader.exists(filename);
		if (!exists) {
			const error = `Backup file not found: ${filename}`;
			this.logService.error({ message: error, category: LogCategory.SYSTEM });
			return { success: false, error };
		}

		const localPath = join(backupConfig.tempDir, filename);

		this.logService.info({
			message: 'Starting backup restoration',
			category: LogCategory.SYSTEM,
			metadata: { filename },
		});

		try {
			await this.mkdirFn(backupConfig.tempDir, { recursive: true });
			await this.storageUploader.download(filename, localPath);
			this.track(localPath);

			const decryptedPath = await this.snapshotHelper.decrypt(localPath);
			this.track(decryptedPath);

			const sqlPath = await this.snapshotHelper.decompress(decryptedPath);
			this.track(sqlPath);

			const preludePath = await this.buildRestorePrelude(filename, sqlPath);

			await this.makeDumpIdempotentInPlace(sqlPath);

			await this.restoreDatabaseFn({
				...pgConnection(),
				sqlPath,
				preludePath,
			});

			this.logService.info({
				message: 'Backup restoration completed',
				category: LogCategory.SYSTEM,
				metadata: { filename },
			});

			return { success: true };
		} catch (error) {
			const coded = error as Error & { code?: string };
			this.logService.error({
				message: 'backup.restore.failed',
				category: LogCategory.SYSTEM,
				error,
				metadata: { filename },
			});
			const failure: RestoreResult = { success: false, error: coded.message };
			if (coded.code) {
				failure.code = coded.code;
			}
			return failure;
		} finally {
			await this.cleanupTemp();
		}
	}

	/**
	 * Build the reset prelude for a restore and write it next to the
	 * decompressed dump, returning the prelude path to replay before the
	 * dump in the same transaction.
	 *
	 * A `full` artifact resets every object its dump re-creates (a catalog
	 * sweep per configured schema). A `differential` artifact resets only
	 * the tables its manifest lists, so the manifest is downloaded and read
	 * here before the prelude can be generated. The produced files are
	 * tracked for cleanup.
	 *
	 * @param filename - The artifact filename (relative to the storage prefix).
	 * @param sqlPath - Local path of the decompressed dump.
	 * @returns The local path of the written prelude.
	 * @throws {Error & { code: string }} When the artifact type cannot be read
	 *   from the filename (coded `E_BACKUP_RESTORE_TYPE_UNKNOWN`), when a
	 *   differential artifact's manifest is missing (coded
	 *   `E_BACKUP_MANIFEST_NOT_FOUND`), or when the manifest carries no table
	 *   list (coded `E_BACKUP_MANIFEST_MALFORMED`).
	 */
	private async buildRestorePrelude(filename: string, sqlPath: string): Promise<string> {
		const type = BackupMetadata.parseType(filename);
		if (!type) {
			throw codedError('E_BACKUP_RESTORE_TYPE_UNKNOWN', `Cannot determine backup type from filename: ${filename}`);
		}

		let prelude: RestorePreludeInput;
		if (type === 'differential') {
			const manifestFilename = BackupMetadata.manifestFilename(filename);
			const manifestLocalPath = join(backupConfig.tempDir, manifestFilename);
			const exists = await this.storageUploader.exists(manifestFilename);
			if (!exists) {
				throw codedError(
					'E_BACKUP_MANIFEST_NOT_FOUND',
					`Manifest not found for differential backup: ${manifestFilename}`,
				);
			}
			await this.storageUploader.download(manifestFilename, manifestLocalPath);
			this.track(manifestLocalPath);
			// The manifest is external data (read back from storage): the
			// discriminated-union `tables` guarantee is enforced here, at the
			// trust boundary, not in the prelude generator.
			const manifest = JSON.parse((await this.readFileFn(manifestLocalPath, 'utf8')) as string) as BackupManifest;
			if (!Array.isArray(manifest.tables)) {
				throw codedError(
					'E_BACKUP_MANIFEST_MALFORMED',
					`Manifest for differential backup is malformed: ${manifestFilename}`,
				);
			}
			prelude = { type, tables: manifest.tables };
		} else {
			prelude = { type };
		}

		const preludePath = `${sqlPath}.prelude.sql`;
		await this.writeFileFn(preludePath, generateRestorePrelude(prelude));
		this.track(preludePath);
		return preludePath;
	}

	/**
	 * Rewrite the decompressed dump in place so replaying it succeeds against
	 * a database that is not empty (see {@link makeDumpIdempotent}).
	 *
	 * @param sqlPath - Local path of the decompressed dump, rewritten in place.
	 */
	private async makeDumpIdempotentInPlace(sqlPath: string): Promise<void> {
		const raw = await this.readFileFn(sqlPath, 'utf8');
		await this.writeFileFn(sqlPath, makeDumpIdempotent(raw));
	}

	/**
	 * List all backup artifacts stored on the configured disk, parsed into
	 * {@link BackupMetadata} and sorted newest first. Storage failures are
	 * logged and swallowed as an empty list.
	 *
	 * Objects that are not backup artifacts are skipped before any metadata
	 * lookup: directory markers, S3 folder-marker objects listed without the
	 * trailing prefix separator (e.g. the `backup` marker created by S3/R2
	 * consoles), and files that do not follow the backup filename grammar
	 * (manifests, stray files).
	 *
	 * @returns An array of backup metadata, newest first.
	 */
	async list(): Promise<BackupMetadata[]> {
		try {
			const objects = await this.storageUploader.listBackups();
			const backups: BackupMetadata[] = [];
			const prefix = `${backupConfig.storage.prefix}/`;

			for (const object of objects) {
				if (object.isDirectory) continue;

				// Folder-marker objects are listed without the trailing
				// separator — their key is the bare prefix, not a file path
				if (!object.key.startsWith(prefix)) continue;

				const filename = object.key.slice(prefix.length);
				// Filter by the backup grammar before hitting the disk so
				// manifests and stray files never reach a metadata lookup
				if (!BackupMetadata.parseFilename(filename)) continue;

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
	 * Run a strategy-specific pipeline body inside the shared envelope: log
	 * the start, ensure the temp directory, execute the body, convert any
	 * failure into a failure result, and always clean up tracked temp files.
	 */
	private async runEnvelope(context: BackupContext, body: () => Promise<BackupResult>): Promise<BackupResult> {
		const startTime = Date.now();
		this.logStart(context);

		try {
			await this.ensureTempDir(context.tempDir);
			return await body();
		} catch (error) {
			return this.failureResult(context, error, Date.now() - startTime);
		} finally {
			await this.cleanupTemp();
		}
	}

	/**
	 * Execute a full backup end to end: dump every table, compress and
	 * encrypt the dump, upload the artifact, then persist a manifest listing
	 * the dumped tables.
	 */
	private async executeFullBackup(context: BackupContext): Promise<BackupResult> {
		const startTime = Date.now();
		const dumpPath = this.dumpPath(context.filename);
		await this.dump(dumpPath);

		const { encryptedPath, size } = await this.compressAndEncrypt(dumpPath);
		await this.uploadBackup(context, encryptedPath);

		const tables = await this.getAllTables();
		await this.writeManifest(context, { tables });

		return this.successResult(context, size, Date.now() - startTime);
	}

	/**
	 * Execute a differential backup end to end: find the last full backup as
	 * the base reference, dump only the tables modified since then, compress
	 * and encrypt the dump, write a manifest referencing the base, and upload
	 * the artifact. When no full backup exists, falls back to a full backup
	 * on the same instance. When no table has been modified, the run is
	 * skipped and no artifact is produced.
	 */
	private async executeDifferentialBackup(context: BackupContext): Promise<BackupResult> {
		const startTime = Date.now();

		const lastFullBackup = await this.findLastFullBackup();
		if (!lastFullBackup) {
			this.logService.warn({
				message: 'No full backup found, running full backup instead',
				category: LogCategory.SYSTEM,
			});

			const fullContext: BackupContext = {
				...context,
				filename: BackupMetadata.generateFilename('full'),
				strategyType: 'full',
			};
			return this.executeFullBackup(fullContext);
		}

		const modifiedTables = await this.getModifiedTables(lastFullBackup.createdAt);

		if (modifiedTables.length === 0) {
			this.logService.info({
				message: 'No tables modified since last backup, skipping',
				category: LogCategory.SYSTEM,
			});
			return this.noArtifactResult(context, Date.now() - startTime);
		}

		this.logService.info({
			message: 'Found modified tables',
			category: LogCategory.SYSTEM,
			metadata: { count: modifiedTables.length, tables: modifiedTables },
		});

		const dumpPath = this.dumpPath(context.filename);
		await this.dump(dumpPath, modifiedTables);

		const { encryptedPath, size } = await this.compressAndEncrypt(dumpPath);
		await this.writeManifest(context, {
			type: 'differential',
			tables: modifiedTables,
			fullBackupReference: lastFullBackup.filename,
		});
		await this.uploadBackup(context, encryptedPath);

		return this.successResult(context, size, Date.now() - startTime);
	}

	/**
	 * Execute `pg_dump` into the given output path, tracking the produced
	 * file for cleanup.
	 *
	 * @param outputPath - Local path to write the SQL dump to.
	 * @param tables - Optional tables to limit the dump to (differential).
	 */
	private async dump(outputPath: string, tables?: string[]): Promise<void> {
		this.track(outputPath);
		await this.createDump({
			...pgConnection(),
			outputPath,
			tables,
			schemas: backupConfig.database.schemas,
		});
	}

	/**
	 * Compress the SQL dump, encrypt it, and measure the resulting artifact.
	 * Tracks the compressed and final paths for cleanup and removes the raw
	 * dump once it has been compressed.
	 *
	 * @param dumpPath - Local path of the SQL dump produced by {@link dump}.
	 * @returns The final artifact path and its size in bytes.
	 */
	private async compressAndEncrypt(dumpPath: string): Promise<{ encryptedPath: string; size: number }> {
		const compressedPath = await this.snapshotHelper.compress(dumpPath);
		this.track(compressedPath);
		await this.unlinkFn(dumpPath);

		const encryptedPath = await this.snapshotHelper.encrypt(compressedPath);
		this.track(encryptedPath);

		const { size } = await this.statFn(encryptedPath);
		return { encryptedPath, size };
	}

	/**
	 * Upload the final backup artifact to storage under the context filename.
	 */
	private uploadBackup(context: BackupContext, finalPath: string): Promise<void> {
		return this.storageUploader.upload(finalPath, context.filename);
	}

	/**
	 * Serialize, write and upload the backup manifest, tracking it for cleanup.
	 *
	 * @param context - Execution context (temp dir, filename).
	 * @param payload - The manifest to persist, typed so the write side pairs
	 *   with the {@link BackupManifest} the restore reads back.
	 * @returns The local path of the written manifest file.
	 */
	private async writeManifest(context: BackupContext, payload: BackupManifest): Promise<string> {
		const manifestFilename = BackupMetadata.manifestFilename(context.filename);
		const manifestPath = join(context.tempDir, manifestFilename);
		await this.writeFileFn(manifestPath, JSON.stringify(payload, null, 2));
		await this.storageUploader.upload(manifestPath, manifestFilename);
		this.track(manifestPath);
		return manifestPath;
	}

	/**
	 * Build the success {@link BackupResult} and log the completion.
	 */
	private successResult(context: BackupContext, size: number, duration: number): BackupResult {
		this.logService.info({
			message: 'Backup completed successfully',
			category: LogCategory.SYSTEM,
			metadata: { filename: context.filename, size, duration },
		});

		return {
			success: true,
			filename: context.filename,
			type: context.strategyType,
			size,
			duration,
			storage: backupConfig.storage.disk,
		};
	}

	/**
	 * Build the success {@link BackupResult} for a run that produced no
	 * artifact (e.g. a differential backup skipped because nothing changed).
	 */
	private noArtifactResult(context: BackupContext, duration: number): BackupResult {
		return {
			success: true,
			filename: '',
			type: context.strategyType,
			size: 0,
			duration,
			storage: backupConfig.storage.disk,
		};
	}

	/**
	 * Build the failure {@link BackupResult} and log the failure.
	 */
	private failureResult(context: BackupContext, error: any, duration: number): BackupResult {
		this.logService.error({
			message: 'backup.run.failed',
			category: LogCategory.SYSTEM,
			error,
			context: { filename: context.filename, duration },
		});

		return {
			success: false,
			filename: context.filename,
			type: context.strategyType,
			size: 0,
			duration,
			storage: backupConfig.storage.disk,
			error: error.message,
		};
	}

	/**
	 * Log the start of a pipeline run.
	 */
	private logStart(context: BackupContext): void {
		this.logService.info({
			message: `Starting ${context.strategyType} backup`,
			category: LogCategory.SYSTEM,
			metadata: { filename: context.filename },
		});
	}

	/**
	 * Create the temp directory (recursively).
	 */
	private async ensureTempDir(tempDir: string): Promise<void> {
		await this.mkdirFn(tempDir, { recursive: true });
	}

	/**
	 * Track a temporary file for removal by {@link cleanupTemp}.
	 */
	private track(path: string): void {
		this.tempFiles.push(path);
	}

	/**
	 * Remove every tracked temp file, silently ignoring missing ones, then
	 * clear the tracking list so a second pass is a no-op.
	 */
	private async cleanupTemp(): Promise<void> {
		for (const path of this.tempFiles) {
			try {
				await this.unlinkFn(path);
			} catch {
				// File already gone — no-op
			}
		}
		this.tempFiles.splice(0);
	}

	/**
	 * Resolve a backup strategy to a concrete type. When the strategy is
	 * `auto`, the configured full-backup weekday decides: full on the
	 * designated day, differential on all others.
	 */
	private resolveStrategy(strategy: BackupStrategy): BackupType {
		if (strategy !== 'auto') return strategy;
		const now = DateTime.now();
		const jsDay = now.weekday === 7 ? 0 : now.weekday;
		return jsDay === backupConfig.schedule.fullBackupDay ? 'full' : 'differential';
	}

	/**
	 * Find the newest full backup stored on the configured disk — the base
	 * reference for a differential run.
	 */
	private async findLastFullBackup(): Promise<BackupMetadata | null> {
		const backups = await this.list();
		const fullBackups = backups.filter((b) => b.type === 'full');
		return fullBackups.length > 0 ? fullBackups[0] : null;
	}

	/**
	 * The Lucid connection for the backup catalog queries.
	 */
	private async lucidConnection() {
		const db = await import('@adonisjs/lucid/services/db');
		return db.default.connection(backupConfig.database.connection);
	}

	/**
	 * List all tables in the managed schemas (persisted in the manifest by
	 * a full backup).
	 */
	private async getAllTables(): Promise<string[]> {
		return this.listManagedTableNames(await this.lucidConnection());
	}

	/**
	 * List the table names in the managed schemas in catalog order.
	 *
	 * @param connection - The Lucid connection to run the catalog query on.
	 */
	private async listManagedTableNames(connection: {
		rawQuery: (sql: string) => Promise<{ rows: any[] }>;
	}): Promise<string[]> {
		const result = await connection.rawQuery(
			`SELECT tablename FROM pg_tables WHERE ${schemaInClause('schemaname')} ORDER BY tablename`,
		);
		return result.rows.map((row: any) => row.tablename);
	}

	/**
	 * List the tables modified since the given date, combining vacuum/analyze
	 * statistics with `updated_at` columns (excluding tables listed in the
	 * differential config exclusions).
	 *
	 * @param since - Reference date (creation time of the base full backup).
	 */
	private async getModifiedTables(since: Date): Promise<string[]> {
		const connection = await this.lucidConnection();

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
          ${schemaInClause('schemaname')}
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

		const modifiedFromStats = result.rows.map((row: any) => row.table_name.replace(/^[^.]*\./, ''));

		const allTables = await this.listManagedTableNames(connection);

		const modifiedFromUpdatedAt: string[] = [];

		for (const table of allTables) {
			if (backupConfig.differential.excludedTables.includes(table)) continue;

			try {
				const hasUpdatedAt = await connection.rawQuery(
					`
            SELECT column_name
            FROM information_schema.columns
            WHERE ${schemaInClause('table_schema')}
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
}

/**
 * Build a `column IN (...)` clause over {@link MANAGED_SCHEMAS} for the
 * catalog queries. The schema set is a module constant (never user input),
 * so the values are inlined as quoted literals rather than bound
 * placeholders.
 *
 * @param column - The catalog column to filter (e.g. `schemaname`, `table_schema`).
 */
function schemaInClause(column: string): string {
	return `${column} IN (${MANAGED_SCHEMAS.map(quoteLiteral).join(', ')})`;
}

/**
 * Build a coded error: a plain `Error` carrying a stable machine-readable
 * code, the service-layer convention for failures a caller may branch on.
 *
 * @param code - The stable error code (e.g. `E_BACKUP_MANIFEST_NOT_FOUND`).
 * @param message - The human-readable error message.
 */
function codedError(code: string, message: string): Error {
	return Object.assign(new Error(message), { code });
}

/**
 * The PostgreSQL connection for the `pg_dump` and `psql` subprocesses,
 * read from env. Called per use: the password is a released secret and
 * must never be cached.
 */
function pgConnection() {
	return {
		host: env.get('PG_HOST')!,
		port: Number(env.get('PG_PORT') || 5432),
		user: env.get('PG_USER')!,
		database: env.get('PG_DB_NAME')!,
		password: env.get('PG_PASSWORD').release(),
	};
}
