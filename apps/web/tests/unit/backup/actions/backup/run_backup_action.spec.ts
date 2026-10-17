import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import sinon from 'sinon';
import { RunBackupAction } from '#backup/actions/backup/run_backup_action';
import { BackupPipeline } from '#backup/services/backup_pipeline';
import type { BackupResult } from '#backup/types/backup';

test.group('RunBackupAction', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	test('execute() delegates to BackupPipeline.run and returns its result', async ({ assert }) => {
		const mockResult: BackupResult = {
			success: true,
			filename: 'backup-full-2024-01-01-020000.sql.gz.enc',
			type: 'full',
			size: 1024,
			duration: 5000,
			storage: 'fs',
		};

		const runStub = sinon.stub(BackupPipeline.prototype, 'run').resolves(mockResult);

		const action = await app.container.make(RunBackupAction);
		const result = await action.execute({ strategy: 'full' });

		assert.strictEqual(result, mockResult);
		assert.isTrue(runStub.calledWith('full'));
	});

	test('execute() defaults to auto strategy when no payload is given', async ({ assert }) => {
		const runStub = sinon
			.stub(BackupPipeline.prototype, 'run')
			.resolves({ success: true, filename: '', type: 'full', size: 0, duration: 0, storage: 'fs' });

		const action = await app.container.make(RunBackupAction);
		await action.execute();

		assert.isTrue(runStub.calledWith('auto'));
	});

	test('execute() passes the explicit strategy to the pipeline', async ({ assert }) => {
		const runStub = sinon
			.stub(BackupPipeline.prototype, 'run')
			.resolves({ success: true, filename: '', type: 'differential', size: 0, duration: 0, storage: 'fs' });

		const action = await app.container.make(RunBackupAction);
		await action.execute({ strategy: 'differential' });

		assert.isTrue(runStub.calledWith('differential'));
	});

	test('execute() propagates failure results from the pipeline', async ({ assert }) => {
		const failureResult: BackupResult = {
			success: false,
			filename: '',
			type: 'full',
			size: 0,
			duration: 0,
			storage: 'fs',
			error: 'Backup failed',
		};

		sinon.stub(BackupPipeline.prototype, 'run').resolves(failureResult);

		const action = await app.container.make(RunBackupAction);
		const result = await action.execute({ strategy: 'full' });

		assert.strictEqual(result.success, false);
	});
});
