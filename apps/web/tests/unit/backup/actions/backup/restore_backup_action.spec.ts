import app from '@adonisjs/core/services/app';
import drive from '@adonisjs/drive/services/main';
import { test } from '@japa/runner';
import sinon from 'sinon';
import { RestoreBackupAction } from '#backup/actions/backup/restore_backup_action';
import backupConfig from '#config/backup';

test.group('RestoreBackupAction', (group) => {
	group.each.teardown(() => {
		sinon.restore();
	});

	group.each.setup(() => {
		drive.fake(backupConfig.storage.disk as any);
	});

	group.each.teardown(() => {
		drive.restore(backupConfig.storage.disk as any);
	});

	test('execute() returns failure when backup file not found', async ({ assert }) => {
		const action = await app.container.make(RestoreBackupAction);
		const result = await action.execute({ filename: 'non-existent-backup.sql.gz.enc' });

		assert.isFalse(result.success);
		assert.isDefined(result.error);
	});
});
