import { join } from 'node:path';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import sinon from 'sinon';
import backupConfig from '#config/backup';

/**
 * Unit tests for `BackupPipeline` — the single public face of the backup
 * domain.
 *
 * `run(strategy)`, `restore(filename)` and `list()` are the public entry
 * points; everything else is exercised end to end through them. All external
 * dependencies are injected via the overrides bag so we never need to stub
 * ESM imports.
 */
test.group('BackupPipeline', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	const manifestName = 'backup-full-2024-01-01-020000.manifest.json';
	const fullFilename = 'backup-full-2024-01-01-020000.sql.gz.enc';
	const differentialFilename = 'backup-differential-2024-01-08-090000.sql.gz.enc';
	const tempDir = backupConfig.tempDir;

	const buildLogService = () =>
		({
			info: sinon.stub(),
			error: sinon.stub(),
			warn: sinon.stub(),
		}) as any;

	const buildOverrides = () => ({
		_snapshotHelper: {
			compress: sinon.stub().resolves('/tmp/backups/x.sql.gz'),
			encrypt: sinon.stub().resolves('/tmp/backups/x.sql.gz.enc'),
			decrypt: sinon.stub(),
			decompress: sinon.stub(),
		} as any,
		_uploader: {
			upload: sinon.stub().resolves(),
			exists: sinon.stub().resolves(true),
			download: sinon.stub().resolves(),
			listBackups: sinon.stub().resolves([]),
			getMetaData: sinon.stub().resolves({
				contentLength: 5000,
				lastModified: new Date('2024-01-01T02:00:00Z'),
			}),
		} as any,
		_mkdir: sinon.stub().resolves(),
		_stat: sinon.stub().resolves({ size: 2048 }),
		_unlink: sinon.stub().resolves(),
		_readFile: sinon.stub().resolves(''),
		_writeFile: sinon.stub().resolves(),
		_createDatabaseDump: sinon.stub().resolves(),
		_restoreDatabase: sinon.stub().resolves(),
	});

	const baseFullBackupObject = {
		key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
		isDirectory: false,
	};

	// ─── dumpPath() ──────────────────────────────────────────────────────────

	test('dumpPath() derives the .sql dump path from the backup filename', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(buildLogService(), buildOverrides());

		assert.equal(pipeline.dumpPath(fullFilename), join(tempDir, 'backup-full-2024-01-01-020000.sql'));
	});

	// ─── run() — strategy resolution ─────────────────────────────────────────

	test('run() resolves "auto" to a full backup on the configured full backup day', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		// Sunday: Luxon weekday 7 maps to JS getDay 0, which matches config fullBackupDay=0
		const mockSunday = DateTime.fromISO('2024-01-07T02:00:00.000Z') as any;
		sinon.stub(DateTime, 'now').returns(mockSunday);

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [{ tablename: 'users' }] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		const generateStub = sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run();

		assert.isTrue(result.success);
		assert.equal(result.type, 'full');
		assert.isTrue(generateStub.calledWith('full'));
	});

	test('run() resolves "auto" to a differential backup on any other day', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([baseFullBackupObject] as any);

		const mockMonday = DateTime.fromISO('2024-01-08T02:00:00.000Z') as any;
		sinon.stub(DateTime, 'now').returns(mockMonday);

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		const generateStub = sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(differentialFilename);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('auto');

		assert.isTrue(result.success);
		assert.equal(result.type, 'differential');
		assert.isTrue(generateStub.calledWith('differential'));
	});

	// ─── run("full") ─────────────────────────────────────────────────────────

	test('run("full") runs dump, compress, encrypt, upload and manifest', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({
				rows: [{ tablename: 'users' }, { tablename: 'posts' }],
			}),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('full');

		assert.isTrue(result.success);
		assert.equal(result.filename, fullFilename);
		assert.equal(result.type, 'full');
		assert.equal(result.size, 2048);
		assert.isNumber(result.duration);
		// The envelope logs the start of the run
		assert.equal(logService.info.firstCall.args[0].message, 'Starting full backup');
		assert.equal(logService.info.firstCall.args[0].metadata.filename, fullFilename);
		// Whole-database dump (no tables restriction) of the pipeline's dump path
		const dumpOptions = overrides._createDatabaseDump.firstCall.args[0];
		assert.equal(dumpOptions.outputPath, join(tempDir, 'backup-full-2024-01-01-020000.sql'));
		assert.isUndefined(dumpOptions.tables);
		// No BACKUP_PG_SCHEMAS in the test env: the dump is not schema-scoped
		assert.deepEqual(dumpOptions.schemas, []);
		assert.isTrue(overrides._snapshotHelper.compress.calledBefore(overrides._snapshotHelper.encrypt));
		assert.deepEqual(JSON.parse(overrides._writeFile.firstCall.args[1]), {
			tables: ['users', 'posts'],
		});
		const successLog = logService.info.getCall(1);
		assert.equal(successLog.args[0].message, 'Backup completed successfully');
		assert.equal(successLog.args[0].metadata.size, 2048);
		// 1 explicit unlink (dump after compress) + cleanup of dump/compressed/encrypted/manifest
		assert.equal(overrides._unlink.callCount, 5);
	});

	test('run("full") scopes the dump to the configured schemas', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		sinon.stub(backupConfig.database, 'schemas').value(['public']);

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('full');

		assert.isTrue(result.success);
		const dumpOptions = overrides._createDatabaseDump.firstCall.args[0];
		assert.deepEqual(dumpOptions.schemas, ['public']);
	});

	test('run("full") uploads the encrypted artifact before the manifest', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [{ tablename: 'users' }] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		await pipeline.run('full');

		const uploadStub = overrides._uploader.upload;
		assert.equal(uploadStub.callCount, 2);
		assert.equal(uploadStub.firstCall.args[0], '/tmp/backups/x.sql.gz.enc');
		assert.equal(uploadStub.firstCall.args[1], fullFilename);
		assert.equal(uploadStub.secondCall.args[0], join(tempDir, manifestName));
		assert.equal(uploadStub.secondCall.args[1], manifestName);
		assert.isTrue(uploadStub.firstCall.calledBefore(uploadStub.secondCall));
	});

	test('run("full") converts a step failure into a logged failure result', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		// Make mkdir throw to trigger the error path before any file is created
		overrides._mkdir = sinon.stub().rejects(new Error('Permission denied'));

		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('full');

		assert.isFalse(result.success);
		assert.equal(result.type, 'full');
		assert.equal(result.size, 0);
		assert.include(result.error, 'Permission denied');
		assert.isTrue(logService.error.calledOnce);
		assert.equal(logService.error.firstCall.args[0].message, 'backup.run.failed');
		assert.equal(logService.error.firstCall.args[0].context.filename, fullFilename);
	});

	test('run("full") cleans up partial temp files on failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		// Encryption fails after the dump was compressed
		overrides._snapshotHelper.encrypt = sinon.stub().rejects(new Error('Encryption failed'));

		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(fullFilename);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('full');

		assert.isFalse(result.success);
		// 1 explicit unlink (dump after compress) + cleanup removes tracked dump/compressed
		assert.equal(overrides._unlink.callCount, 3);
	});

	// ─── run("differential") ─────────────────────────────────────────────────

	test('run("differential") falls back to a full backup inside the pipeline when no full backup exists', async ({
		assert,
	}) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [{ tablename: 'users' }] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		const generateStub = sinon
			.stub(domainModule.BackupMetadata, 'generateFilename')
			.onCall(0)
			.returns(differentialFilename)
			.onCall(1)
			.returns(fullFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('differential');

		assert.isTrue(result.success);
		assert.equal(result.type, 'full');
		assert.equal(result.filename, fullFilename);
		assert.isTrue(logService.warn.calledOnce);
		assert.include(logService.warn.firstCall.args[0].message, 'No full backup found');
		// Verify the filename was regenerated with 'full' type before delegating
		assert.isTrue(generateStub.calledWith('full'), 'generateFilename should be called with full type on fallback');
		// The shared temp-file tracking survives the fallback: a single cleanup pass
		assert.equal(overrides._unlink.callCount, 5);
	});

	test('run("differential") skips when no tables have been modified', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([baseFullBackupObject] as any);

		// Mock DB — no modified tables
		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(differentialFilename);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('differential');

		assert.isTrue(result.success);
		assert.equal(result.type, 'differential');
		assert.equal(result.size, 0);
		assert.equal(result.filename, '');
		assert.include(
			logService.info.getCalls().map((call: any) => call.args[0].message),
			'No tables modified since last backup, skipping',
		);
	});

	test('run("differential") dumps the modified tables and writes the differential manifest', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([baseFullBackupObject] as any);
		const uploadStub = overrides._uploader.upload;

		// Mock DB — return modified tables
		const dbModule = await import('@adonisjs/lucid/services/db');
		const connStub = {
			rawQuery: sinon
				.stub()
				.onCall(0)
				.resolves({ rows: [{ table_name: 'public.users' }] }) // pg_stat_user_tables — modified
				.onCall(1)
				.resolves({ rows: [{ tablename: 'users' }] }) // pg_tables
				.resolves({ rows: [] }), // default for further calls
		};
		sinon.stub(dbModule.default, 'connection').returns(connStub as any);

		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(differentialFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns('m.manifest.json');

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('differential');

		assert.isTrue(result.success);
		assert.equal(result.type, 'differential');
		assert.equal(result.size, 2048);
		assert.equal(result.filename, differentialFilename);
		// Table selection: the dump is restricted to the modified tables
		const dumpOptions = overrides._createDatabaseDump.firstCall.args[0];
		assert.equal(dumpOptions.outputPath, join(tempDir, 'backup-differential-2024-01-08-090000.sql'));
		assert.deepEqual(dumpOptions.tables, ['users']);
		// The manifest lists the dumped tables and references the base full backup
		assert.deepEqual(JSON.parse(overrides._writeFile.firstCall.args[1]), {
			type: 'differential',
			tables: ['users'],
			fullBackupReference: 'backup-full-2024-01-01-020000.sql.gz.enc',
		});
		// The artifact (2nd upload, after the manifest) goes out under the differential filename
		assert.equal(uploadStub.callCount, 2);
		assert.equal(uploadStub.secondCall.args[0], '/tmp/backups/x.sql.gz.enc');
		assert.equal(uploadStub.secondCall.args[1], differentialFilename);
		// 1 explicit unlink (dump after compress) + cleanup of dump/compressed/encrypted/manifest
		assert.equal(overrides._unlink.callCount, 5);
	});

	test('run("differential") returns a failure result on step failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._mkdir = sinon.stub().rejects(new Error('Disk full'));

		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(differentialFilename);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('differential');

		assert.isFalse(result.success);
		assert.equal(result.type, 'differential');
		assert.include(result.error, 'Disk full');
	});

	test('run("differential") cleans up temp files on failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([baseFullBackupObject] as any);
		// Encryption fails after the dump was compressed
		overrides._snapshotHelper.encrypt = sinon.stub().rejects(new Error('Encryption failed'));

		// Mock DB — return modified tables
		const dbModule = await import('@adonisjs/lucid/services/db');
		const connStub = {
			rawQuery: sinon
				.stub()
				.onCall(0)
				.resolves({ rows: [{ table_name: 'public.users' }] })
				.onCall(1)
				.resolves({ rows: [{ tablename: 'users' }] })
				.resolves({ rows: [] }),
		};
		sinon.stub(dbModule.default, 'connection').returns(connStub as any);

		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'generateFilename').returns(differentialFilename);
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns('m.manifest.json');

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const result = await pipeline.run('differential');

		assert.isFalse(result.success);
		// 1 explicit unlink (dump after compress) + cleanup removes tracked dump/compressed
		assert.equal(overrides._unlink.callCount, 3);
	});

	// ─── restore() ───────────────────────────────────────────────────────────

	const restoreFilename = 'backup-full-2024-01-01-020000.sql.gz.enc';
	const restoreLocalPath = join(tempDir, restoreFilename);
	const restoreDecryptedPath = restoreLocalPath.slice(0, -'.enc'.length);
	const restoreSqlPath = restoreDecryptedPath.slice(0, -'.gz'.length);
	const restorePreludePath = `${restoreSqlPath}.prelude.sql`;
	const differentialRestoreFilename = 'backup-differential-2024-01-08-090000.sql.gz.enc';
	const differentialRestoreLocalPath = join(tempDir, differentialRestoreFilename);
	const differentialRestoreDecryptedPath = differentialRestoreLocalPath.slice(0, -'.enc'.length);
	const differentialRestoreSqlPath = differentialRestoreDecryptedPath.slice(0, -'.gz'.length);
	const differentialRestoreManifestFilename = 'backup-differential-2024-01-08-090000.manifest.json';

	// A pipeline wired for a restore happy path: the snapshot helper decrypts
	// and decompresses to the given paths, and — when given — the dump file
	// reads as the given SQL script.
	const buildRestorePipeline = async (decryptedPath: string, sqlPath: string, dumpContents?: string) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._snapshotHelper.decrypt.resolves(decryptedPath);
		overrides._snapshotHelper.decompress.resolves(sqlPath);
		if (dumpContents !== undefined) {
			overrides._readFile.resolves(dumpContents);
		}
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		return { pipeline: new BackupPipeline(logService, overrides), overrides, logService };
	};

	test('restore() downloads, decrypts, decompresses and restores the database', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);

		const result = await pipeline.restore(restoreFilename);

		assert.deepEqual(result, { success: true });
		assert.isTrue(overrides._uploader.exists.calledWith(restoreFilename));
		assert.isTrue(overrides._mkdir.calledWith(tempDir, { recursive: true }));
		assert.isTrue(overrides._uploader.download.calledWith(restoreFilename, restoreLocalPath));
		assert.isTrue(overrides._snapshotHelper.decrypt.calledWith(restoreLocalPath));
		assert.isTrue(overrides._snapshotHelper.decompress.calledWith(restoreDecryptedPath));
		assert.isTrue(overrides._restoreDatabase.calledOnce);
		assert.equal(overrides._restoreDatabase.firstCall.args[0].sqlPath, restoreSqlPath);
		assert.equal(overrides._restoreDatabase.firstCall.args[0].preludePath, restorePreludePath);
	});

	test('restore() rewrites the dump in place so the replay is idempotent', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;\nCREATE FUNCTION public.f() RETURNS void',
		);

		await pipeline.restore(restoreFilename);

		assert.isTrue(overrides._readFile.calledWith(restoreSqlPath, 'utf8'));
		const rewriteCall = overrides._writeFile.getCalls().find((call) => call.args[0] === restoreSqlPath);
		assert.isDefined(rewriteCall);
		assert.include(rewriteCall!.args[1], 'CREATE SCHEMA IF NOT EXISTS public;');
		assert.include(rewriteCall!.args[1], 'CREATE OR REPLACE FUNCTION public.f() RETURNS void');
	});

	test('restore() writes a catalog reset prelude for full artifacts and replays it before the dump', async ({
		assert,
	}) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);

		await pipeline.restore(restoreFilename);

		const preludeCall = overrides._writeFile.getCalls().find((call) => call.args[0] === restorePreludePath);
		assert.isDefined(preludeCall);
		const prelude = preludeCall!.args[1];
		assert.include(prelude, "c.relkind IN ('r', 'p', 'v', 'm', 'S')");
		assert.include(prelude, "t.typtype IN ('b', 'c', 'd', 'e')");
		assert.include(prelude, "n.nspname = 'public'");
		assert.isTrue(overrides._writeFile.calledBefore(overrides._restoreDatabase));
	});

	test('restore() resets only the manifest tables for differential artifacts', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			differentialRestoreDecryptedPath,
			differentialRestoreSqlPath,
		);
		overrides._readFile.callsFake((path: any) =>
			Promise.resolve(String(path).endsWith('.manifest.json') ? JSON.stringify({ tables: ['users', 'posts'] }) : ''),
		);

		const result = await pipeline.restore(differentialRestoreFilename);

		assert.isTrue(result.success);
		assert.isTrue(overrides._uploader.exists.calledWith(differentialRestoreManifestFilename));
		assert.isTrue(
			overrides._uploader.download.calledWith(
				differentialRestoreManifestFilename,
				join(tempDir, differentialRestoreManifestFilename),
			),
		);
		const preludeCall = overrides._writeFile
			.getCalls()
			.find((call) => call.args[0] === `${differentialRestoreSqlPath}.prelude.sql`);
		assert.isDefined(preludeCall);
		const prelude = preludeCall!.args[1];
		assert.include(prelude, 'DROP TABLE IF EXISTS "public"."users";');
		assert.include(prelude, 'DROP TABLE IF EXISTS "public"."posts";');
		assert.notInclude(prelude, 'CASCADE');
		assert.notInclude(prelude, 'pg_class');
	});

	test('restore() fails when the differential manifest is missing', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			differentialRestoreDecryptedPath,
			differentialRestoreSqlPath,
		);
		overrides._uploader.exists.callsFake((filename: string) => Promise.resolve(!filename.endsWith('.manifest.json')));

		const result = await pipeline.restore(differentialRestoreFilename);

		assert.deepEqual(result, {
			success: false,
			error: `Manifest not found for differential backup: ${differentialRestoreManifestFilename}`,
			code: 'E_BACKUP_MANIFEST_NOT_FOUND',
		});
		assert.isFalse(overrides._restoreDatabase.called);
	});

	test('restore() fails when the differential manifest carries no table list', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			differentialRestoreDecryptedPath,
			differentialRestoreSqlPath,
		);
		overrides._readFile.callsFake((path: any) =>
			Promise.resolve(String(path).endsWith('.manifest.json') ? JSON.stringify({}) : ''),
		);

		const result = await pipeline.restore(differentialRestoreFilename);

		assert.deepEqual(result, {
			success: false,
			error: `Manifest for differential backup is malformed: ${differentialRestoreManifestFilename}`,
			code: 'E_BACKUP_MANIFEST_MALFORMED',
		});
		assert.isFalse(overrides._restoreDatabase.called);
	});

	test('restore() fails when the artifact type cannot be determined from the filename', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);

		const result = await pipeline.restore('custom-dump.sql.gz.enc');

		assert.deepEqual(result, {
			success: false,
			error: 'Cannot determine backup type from filename: custom-dump.sql.gz.enc',
			code: 'E_BACKUP_RESTORE_TYPE_UNKNOWN',
		});
		assert.isFalse(overrides._restoreDatabase.called);
	});

	test('restore() returns a failure result when the backup file is not found', async ({ assert }) => {
		const { pipeline, overrides, logService } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);
		overrides._uploader.exists.resolves(false);

		const result = await pipeline.restore('backup-missing.sql.gz.enc');

		assert.deepEqual(result, { success: false, error: 'Backup file not found: backup-missing.sql.gz.enc' });
		assert.isFalse(overrides._uploader.download.called);
		assert.isFalse(overrides._restoreDatabase.called);
		assert.isTrue(logService.error.calledOnce);
	});

	test('restore() cleans up the downloaded artifacts after the restore', async ({ assert }) => {
		const { pipeline, overrides } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);

		const result = await pipeline.restore(restoreFilename);

		assert.isTrue(result.success);
		assert.deepEqual(
			overrides._unlink.getCalls().map((call) => call.args[0]),
			[restoreLocalPath, restoreDecryptedPath, restoreSqlPath, restorePreludePath],
		);
	});

	test('restore() cleans up partial artifacts when the database restore fails', async ({ assert }) => {
		const { pipeline, overrides, logService } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);
		overrides._restoreDatabase.rejects(new Error('psql exploded'));

		const result = await pipeline.restore(restoreFilename);

		assert.deepEqual(result, { success: false, error: 'psql exploded' });
		assert.isTrue(logService.error.calledOnce);
		assert.equal(logService.error.firstCall.args[0].message, 'backup.restore.failed');
		assert.deepEqual(
			overrides._unlink.getCalls().map((call) => call.args[0]),
			[restoreLocalPath, restoreDecryptedPath, restoreSqlPath, restorePreludePath],
		);
	});

	test('restore() logs the start and completion of the restore', async ({ assert }) => {
		const { pipeline, logService } = await buildRestorePipeline(
			restoreDecryptedPath,
			restoreSqlPath,
			'CREATE SCHEMA public;',
		);

		await pipeline.restore(restoreFilename);

		assert.equal(logService.info.firstCall.args[0].message, 'Starting backup restoration');
		assert.equal(logService.info.secondCall.args[0].message, 'Backup restoration completed');
	});

	// ─── list() ──────────────────────────────────────────────────────────────

	test('list() parses stored objects into metadata sorted newest first', async ({ assert }) => {
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([
			baseFullBackupObject,
			{ key: 'backup/backup-differential-2024-01-02-030000.sql.gz.enc', isDirectory: false },
			{ key: 'backup/some/dir', isDirectory: true },
			{ key: 'backup/notes.txt', isDirectory: false },
		] as any);
		overrides._uploader.getMetaData.callsFake(async (key: string) => {
			if (key.includes('differential')) {
				return { contentLength: 111, lastModified: new Date('2024-01-02T03:00:00') };
			}
			return { contentLength: 222, lastModified: new Date('2024-01-01T02:00:00') };
		});

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(buildLogService(), overrides);

		const backups = await pipeline.list();

		assert.lengthOf(backups, 2);
		assert.equal(backups[0].filename, 'backup-differential-2024-01-02-030000.sql.gz.enc');
		assert.equal(backups[0].type, 'differential');
		assert.equal(backups[0].size, 111);
		assert.equal(backups[1].filename, 'backup-full-2024-01-01-020000.sql.gz.enc');
		assert.equal(backups[1].type, 'full');
	});

	test('list() skips S3 folder-marker objects under the backup prefix', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([
			// The `backup/` folder-marker object created by S3/R2 consoles,
			// listed as a file whose trailing slash is normalized away
			{ key: 'backup', isDirectory: false },
			baseFullBackupObject,
		] as any);
		overrides._uploader.getMetaData.callsFake(async (key: string) => {
			if (!key.startsWith('backup/')) {
				throw new Error(`Unable to retrieve metadata of file at location "${key}"`);
			}
			return { contentLength: 222, lastModified: new Date('2024-01-01T02:00:00') };
		});

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const backups = await pipeline.list();

		assert.lengthOf(backups, 1);
		assert.equal(backups[0].filename, 'backup-full-2024-01-01-020000.sql.gz.enc');
		// Metadata is only fetched for objects actually under the prefix
		assert.isTrue(overrides._uploader.getMetaData.calledOnce);
		assert.isTrue(overrides._uploader.getMetaData.calledWith('backup/backup-full-2024-01-01-020000.sql.gz.enc'));
		assert.isFalse(logService.error.called);
	});

	test('list() skips manifest and stray files under the backup prefix', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.resolves([
			{ key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc', isDirectory: false },
			{ key: 'backup/backup-full-2024-01-01-020000.manifest.json', isDirectory: false },
			{ key: 'backup/notes.txt', isDirectory: false },
		] as any);
		overrides._uploader.getMetaData.callsFake(async () => ({
			contentLength: 222,
			lastModified: new Date('2024-01-01T02:00:00'),
		}));

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const backups = await pipeline.list();

		assert.lengthOf(backups, 1);
		assert.equal(backups[0].filename, 'backup-full-2024-01-01-020000.sql.gz.enc');
		assert.equal(backups[0].type, 'full');
		// Metadata is only fetched for artifacts matching the backup grammar
		assert.isTrue(overrides._uploader.getMetaData.calledOnce);
		assert.isTrue(overrides._uploader.getMetaData.calledWith('backup/backup-full-2024-01-01-020000.sql.gz.enc'));
		assert.isFalse(logService.error.called);
	});

	test('list() returns an empty list and logs when the disk is unavailable', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._uploader.listBackups.rejects(new Error('disk down'));

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(logService, overrides);

		const backups = await pipeline.list();

		assert.deepEqual(backups, []);
		assert.isTrue(logService.error.calledOnce);
		assert.include(logService.error.firstCall.args[0].message, 'Failed to list backups from Drive');
	});
});
