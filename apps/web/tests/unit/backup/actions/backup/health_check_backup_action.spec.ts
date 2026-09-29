import app from '@adonisjs/core/services/app';
import drive from '@adonisjs/drive/services/main';
import { test } from '@japa/runner';
import { HealthCheckBackupAction } from '#backup/actions/backup/health_check_backup_action';
import backupConfig from '#config/backup';
import { mockDriveListing } from '#tests/helpers/mock_drive_listing';

test.group('HealthCheckBackupAction', (group) => {
	group.each.setup(() => {
		drive.fake(backupConfig.storage.disk as Parameters<typeof drive.use>[0]);
		const disk = drive.use(backupConfig.storage.disk) as any;
		mockDriveListing(disk);
	});

	group.each.teardown(() => {
		drive.restore(backupConfig.storage.disk as any);
	});

	test('execute() reports no backups found when empty', async ({ assert }) => {
		const action = await app.container.make(HealthCheckBackupAction);
		const result = await action.execute();

		assert.equal(result.totalBackups, 0);
		assert.include(result.issues, 'No backups found');
	});
});
