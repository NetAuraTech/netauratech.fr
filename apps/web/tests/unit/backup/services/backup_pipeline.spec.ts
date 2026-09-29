import { join } from 'node:path';
import { test } from '@japa/runner';
import sinon from 'sinon';

/**
 * Unit tests for `BackupPipeline`.
 *
 * All external dependencies are injected via the overrides bag so we never
 * need to stub ESM imports.
 */
test.group('BackupPipeline', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	const manifestName = 'backup-full-2024-01-01-020000.manifest.json';

	const context = {
		tempDir: '/tmp/backups',
		filename: 'backup-full-2024-01-01-020000.gz.enc',
		strategyType: 'full' as const,
	};

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
		} as any,
		_uploader: { upload: sinon.stub().resolves() } as any,
		_mkdir: sinon.stub().resolves(),
		_stat: sinon.stub().resolves({ size: 2048 }),
		_unlink: sinon.stub().resolves(),
		_writeFile: sinon.stub().resolves(),
		_createDatabaseDump: sinon.stub().resolves(),
	});

	test('dumpPath() derives the .sql dump path from the backup filename', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(context, buildLogService(), buildOverrides());

		assert.equal(pipeline.dumpPath(), join('/tmp/backups', 'backup-full-2024-01-01-020000.sql'));
	});

	test('dump() tracks the output file and forwards dump options', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const overrides = buildOverrides();
		const pipeline = new BackupPipeline(context, logService, overrides);

		await pipeline.dump('/tmp/backups/out.sql', ['users']);

		assert.isTrue(overrides._createDatabaseDump.calledOnce);
		const options = overrides._createDatabaseDump.firstCall.args[0];
		assert.equal(options.outputPath, '/tmp/backups/out.sql');
		assert.deepEqual(options.tables, ['users']);
		// The dump file is tracked — cleanup() removes it after the run
		const result = await pipeline.run(async () => pipeline.noArtifactResult(0));
		assert.isTrue(result.success);
		assert.equal(overrides._unlink.firstCall.args[0], '/tmp/backups/out.sql');
	});

	test('compressAndEncrypt() runs compress, unlink dump, encrypt and stat in order', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const overrides = buildOverrides();
		const pipeline = new BackupPipeline(context, logService, overrides);

		const { encryptedPath, size } = await pipeline.compressAndEncrypt('/tmp/backups/out.sql');

		assert.equal(encryptedPath, '/tmp/backups/x.sql.gz.enc');
		assert.equal(size, 2048);
		assert.isTrue(overrides._snapshotHelper.compress.calledWith('/tmp/backups/out.sql'));
		assert.isTrue(overrides._snapshotHelper.encrypt.calledWith('/tmp/backups/x.sql.gz'));
		assert.isTrue(overrides._snapshotHelper.compress.calledBefore(overrides._snapshotHelper.encrypt));
		// Explicit unlink of the raw dump happens after compression, before encryption
		assert.equal(overrides._unlink.firstCall.args[0], '/tmp/backups/out.sql');
		assert.isTrue(overrides._snapshotHelper.compress.calledBefore(overrides._unlink));
		assert.isTrue(overrides._unlink.calledBefore(overrides._snapshotHelper.encrypt));
		assert.isTrue(overrides._stat.calledWith('/tmp/backups/x.sql.gz.enc'));
	});

	test('uploadBackup() uploads the artifact under the context filename', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const overrides = buildOverrides();
		const pipeline = new BackupPipeline(context, buildLogService(), overrides as any);

		await pipeline.uploadBackup('/tmp/backups/x.sql.gz.enc');

		const uploadStub = overrides._uploader.upload;
		assert.isTrue(uploadStub.calledOnce);
		assert.equal(uploadStub.firstCall.args[0], '/tmp/backups/x.sql.gz.enc');
		assert.equal(uploadStub.firstCall.args[1], context.filename);
	});

	test('writeManifest() serializes, writes, uploads and tracks the manifest', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const overrides = buildOverrides();
		const pipeline = new BackupPipeline(context, logService, overrides);

		const manifestPath = await pipeline.writeManifest({ tables: ['users'] });

		assert.equal(manifestPath, join('/tmp/backups', manifestName));
		assert.isTrue(overrides._writeFile.calledOnce);
		assert.deepEqual(JSON.parse(overrides._writeFile.firstCall.args[1]), { tables: ['users'] });
		assert.isTrue(overrides._uploader.upload.calledOnce);
		assert.equal(overrides._uploader.upload.firstCall.args[0], manifestPath);
		assert.equal(overrides._uploader.upload.firstCall.args[1], manifestName);
	});

	test('run() returns the body result and cleans up every tracked temp file', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const overrides = buildOverrides();
		const pipeline = new BackupPipeline(context, logService, overrides);

		const result = await pipeline.run(async (elapsed) => {
			await pipeline.dump('/tmp/backups/out.sql');
			await pipeline.compressAndEncrypt('/tmp/backups/out.sql');
			await pipeline.writeManifest({ tables: [] });
			await pipeline.uploadBackup('/tmp/backups/x.sql.gz.enc');
			return pipeline.successResult(42, elapsed());
		});

		assert.isTrue(result.success);
		assert.equal(result.size, 42);
		assert.equal(result.filename, context.filename);
		// 1 explicit unlink (dump after compress) + cleanup of dump/compressed/encrypted/manifest
		assert.equal(overrides._unlink.callCount, 5);
		assert.deepEqual(
			overrides._unlink.getCalls().map((call) => call.args[0]),
			[
				'/tmp/backups/out.sql',
				'/tmp/backups/out.sql',
				'/tmp/backups/x.sql.gz',
				'/tmp/backups/x.sql.gz.enc',
				join('/tmp/backups', manifestName),
			],
		);
	});

	test('run() logs the start of the run', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const pipeline = new BackupPipeline(context, logService, buildOverrides());

		await pipeline.run(async () => pipeline.noArtifactResult(0));

		assert.isTrue(logService.info.calledOnce);
		assert.equal(logService.info.firstCall.args[0].message, 'Starting full backup');
		assert.equal(logService.info.firstCall.args[0].metadata.filename, context.filename);
	});

	test('run() converts a body failure into a logged failure result', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const pipeline = new BackupPipeline(context, logService, buildOverrides());

		const result = await pipeline.run(async () => {
			throw new Error('boom');
		});

		assert.isFalse(result.success);
		assert.equal(result.type, 'full');
		assert.equal(result.size, 0);
		assert.include(result.error, 'boom');
		assert.isTrue(logService.error.calledOnce);
		assert.equal(logService.error.firstCall.args[0].message, 'Full backup failed');
		assert.equal(logService.error.firstCall.args[0].context.filename, context.filename);
	});

	test('run() keeps failing cleanup silent when a temp file is already gone', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const overrides = buildOverrides();
		overrides._unlink = sinon.stub().rejects(new Error('ENOENT'));
		const pipeline = new BackupPipeline(context, logService, overrides);

		const result = await pipeline.run(async () => {
			await pipeline.dump('/tmp/backups/out.sql');
			return pipeline.noArtifactResult(0);
		});

		assert.isTrue(result.success);
		assert.equal(overrides._unlink.callCount, 1);
	});

	test('successResult() logs completion metadata and builds the result', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const pipeline = new BackupPipeline(context, logService, buildOverrides());
		const { default: backupConfig } = await import('#config/backup');

		const result = pipeline.successResult(1234, 567);

		assert.deepEqual(result, {
			success: true,
			filename: context.filename,
			type: 'full',
			size: 1234,
			duration: 567,
			storage: backupConfig.storage.disk,
		});
		assert.equal(logService.info.firstCall.args[0].message, 'Backup completed successfully');
		assert.deepEqual(logService.info.firstCall.args[0].metadata, {
			filename: context.filename,
			size: 1234,
			duration: 567,
		});
	});

	test('noArtifactResult() builds a success result without a filename or size', async ({ assert }) => {
		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const logService = buildLogService();
		const pipeline = new BackupPipeline(
			{ ...context, strategyType: 'differential' as const },
			logService,
			buildOverrides(),
		);

		const result = pipeline.noArtifactResult(42);

		assert.isTrue(result.success);
		assert.equal(result.filename, '');
		assert.equal(result.type, 'differential');
		assert.equal(result.size, 0);
		assert.equal(result.duration, 42);
		assert.isFalse('error' in result);
	});

	// ─── executeFullBackup() ─────────────────────────────────────────────────
	//
	// Coverage migrated from the retired FullBackupStrategy spec: full backups
	// run end to end through the pipeline without a dedicated strategy module.

	test('executeFullBackup() runs dump, compress, encrypt, upload and manifest', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({
				rows: [{ tablename: 'users' }, { tablename: 'posts' }],
			}),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(context, logService, overrides);

		const result = await pipeline.executeFullBackup();

		assert.isTrue(result.success);
		assert.equal(result.filename, context.filename);
		assert.equal(result.type, 'full');
		assert.equal(result.size, 2048);
		assert.isNumber(result.duration);
		// Whole-database dump (no tables restriction) of the pipeline's dump path
		const dumpOptions = overrides._createDatabaseDump.firstCall.args[0];
		assert.equal(dumpOptions.outputPath, join('/tmp/backups', 'backup-full-2024-01-01-020000.sql'));
		assert.isUndefined(dumpOptions.tables);
		assert.isTrue(overrides._snapshotHelper.compress.calledBefore(overrides._snapshotHelper.encrypt));
		// The artifact is uploaded before the manifest lists the dumped tables
		assert.deepEqual(JSON.parse(overrides._writeFile.firstCall.args[1]), {
			tables: ['users', 'posts'],
		});
		const successLog = logService.info.getCall(1);
		assert.equal(successLog.args[0].message, 'Backup completed successfully');
		assert.equal(successLog.args[0].metadata.size, 2048);
		// 1 explicit unlink (dump after compress) + cleanup of dump/compressed/encrypted/manifest
		assert.equal(overrides._unlink.callCount, 5);
	});

	test('executeFullBackup() uploads the encrypted artifact before the manifest', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();

		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [{ tablename: 'users' }] }),
		} as any);
		const domainModule = await import('#backup/domain/backup');
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns(manifestName);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(context, logService, overrides);

		await pipeline.executeFullBackup();

		const uploadStub = overrides._uploader.upload;
		assert.equal(uploadStub.callCount, 2);
		assert.equal(uploadStub.firstCall.args[0], '/tmp/backups/x.sql.gz.enc');
		assert.equal(uploadStub.firstCall.args[1], context.filename);
		assert.equal(uploadStub.secondCall.args[0], join('/tmp/backups', manifestName));
		assert.equal(uploadStub.secondCall.args[1], manifestName);
		assert.isTrue(uploadStub.firstCall.calledBefore(uploadStub.secondCall));
	});

	test('executeFullBackup() converts a step failure into a logged failure result', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		// Make mkdir throw to trigger the error path before any file is created
		overrides._mkdir = sinon.stub().rejects(new Error('Permission denied'));

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(context, logService, overrides);

		const result = await pipeline.executeFullBackup();

		assert.isFalse(result.success);
		assert.equal(result.type, 'full');
		assert.equal(result.size, 0);
		assert.include(result.error, 'Permission denied');
		assert.isTrue(logService.error.calledOnce);
	});

	test('executeFullBackup() cleans up partial temp files on failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildOverrides();
		// Encryption fails after the dump was compressed
		overrides._snapshotHelper.encrypt = sinon.stub().rejects(new Error('Encryption failed'));

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(context, logService, overrides);

		const result = await pipeline.executeFullBackup();

		assert.isFalse(result.success);
		// 1 explicit unlink (dump after compress) + cleanup removes tracked dump/compressed
		assert.equal(overrides._unlink.callCount, 3);
	});

	// ─── executeDifferentialBackup() ─────────────────────────────────────────
	//
	// Coverage migrated from the retired DifferentialBackupStrategy spec:
	// differential backups run end to end through the pipeline, with table
	// selection (dumped tables, base full backup reference, fallback, skip)
	// as their only variation point.

	const differentialContext = {
		tempDir: '/tmp/backups',
		filename: 'backup-differential-2024.sql.gz.enc',
		strategyType: 'differential' as const,
	};

	const baseFullBackupObject = {
		key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
		isDirectory: false,
	};

	const buildDifferentialOverrides = (fullBackups: any[] = []) => {
		const overrides = buildOverrides();
		overrides._uploader = {
			upload: sinon.stub().resolves(),
			listBackups: sinon.stub().resolves(fullBackups as any),
			getMetaData: sinon.stub().resolves({
				contentLength: 5000,
				lastModified: new Date('2024-01-01T02:00:00Z'),
			}),
		} as any;
		return overrides;
	};

	test('executeDifferentialBackup() falls back to a full backup inside the pipeline when no full backup exists', async ({
		assert,
	}) => {
		const logService = buildLogService();
		const overrides = buildDifferentialOverrides();

		const domainModule = await import('#backup/domain/backup');
		const generateStub = sinon
			.stub(domainModule.BackupMetadata, 'generateFilename')
			.returns('backup-full-2024.sql.gz.enc');
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns('m.manifest.json');

		// The fallback delegates to the full entry point on a fresh full-typed pipeline
		const pipelineModule = await import('#backup/services/backup_pipeline');
		const executeStub = sinon.stub().resolves({
			success: true,
			filename: 'backup-full-2024.sql.gz.enc',
			type: 'full' as const,
			size: 1024,
			duration: 500,
			storage: 'fs',
		});
		sinon.stub(pipelineModule.BackupPipeline.prototype, 'executeFullBackup').callsFake(executeStub);

		const { BackupPipeline } = pipelineModule;
		const pipeline = new BackupPipeline(differentialContext, logService, overrides);

		const result = await pipeline.executeDifferentialBackup();

		assert.isTrue(result.success);
		assert.equal(result.type, 'full');
		assert.equal(result.filename, 'backup-full-2024.sql.gz.enc');
		assert.isTrue(executeStub.calledOnce);
		assert.isTrue(logService.warn.calledOnce);
		assert.include(logService.warn.firstCall.args[0].message, 'No full backup found');
		// Verify the filename was regenerated with 'full' type before delegating
		assert.isTrue(generateStub.calledWith('full'), 'generateFilename should be called with full type on fallback');
	});

	test('executeDifferentialBackup() skips when no tables have been modified', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildDifferentialOverrides([baseFullBackupObject]);

		// Mock DB — no modified tables
		const dbModule = await import('@adonisjs/lucid/services/db');
		sinon.stub(dbModule.default, 'connection').returns({
			rawQuery: sinon.stub().resolves({ rows: [] }),
		} as any);

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(differentialContext, logService, overrides);

		const result = await pipeline.executeDifferentialBackup();

		assert.isTrue(result.success);
		assert.equal(result.type, 'differential');
		assert.equal(result.size, 0);
		assert.equal(result.filename, '');
		assert.include(
			logService.info.getCalls().map((call: any) => call.args[0].message),
			'No tables modified since last backup, skipping',
		);
	});

	test('executeDifferentialBackup() dumps the modified tables and writes the differential manifest', async ({
		assert,
	}) => {
		const logService = buildLogService();
		const overrides = buildDifferentialOverrides([baseFullBackupObject]);
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
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns('m.manifest.json');

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(differentialContext, logService, overrides);

		const result = await pipeline.executeDifferentialBackup();

		assert.isTrue(result.success);
		assert.equal(result.type, 'differential');
		assert.equal(result.size, 2048);
		assert.equal(result.filename, differentialContext.filename);
		// Table selection: the dump is restricted to the modified tables
		const dumpOptions = overrides._createDatabaseDump.firstCall.args[0];
		assert.equal(dumpOptions.outputPath, join('/tmp/backups', 'backup-differential-2024.sql'));
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
		assert.equal(uploadStub.secondCall.args[1], differentialContext.filename);
		// 1 explicit unlink (dump after compress) + cleanup of dump/compressed/encrypted/manifest
		assert.equal(overrides._unlink.callCount, 5);
	});

	test('executeDifferentialBackup() returns a failure result on step failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildDifferentialOverrides();
		overrides._mkdir = sinon.stub().rejects(new Error('Disk full'));

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(differentialContext, logService, overrides);

		const result = await pipeline.executeDifferentialBackup();

		assert.isFalse(result.success);
		assert.equal(result.type, 'differential');
		assert.include(result.error, 'Disk full');
	});

	test('executeDifferentialBackup() cleans up temp files on failure', async ({ assert }) => {
		const logService = buildLogService();
		const overrides = buildDifferentialOverrides([baseFullBackupObject]);
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
		sinon.stub(domainModule.BackupMetadata, 'manifestFilename').returns('m.manifest.json');

		const { BackupPipeline } = await import('#backup/services/backup_pipeline');
		const pipeline = new BackupPipeline(differentialContext, logService, overrides);

		const result = await pipeline.executeDifferentialBackup();

		assert.isFalse(result.success);
		// 1 explicit unlink (dump after compress) + cleanup removes tracked dump/compressed
		assert.equal(overrides._unlink.callCount, 3);
	});
});
