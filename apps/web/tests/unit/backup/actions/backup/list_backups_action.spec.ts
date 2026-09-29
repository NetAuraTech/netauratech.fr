import app from '@adonisjs/core/services/app';
import drive from '@adonisjs/drive/services/main';
import { test } from '@japa/runner';
import { ListBackupsAction } from '#backup/actions/backup/list_backups_action';
import backupConfig from '#config/backup';
import { mockDriveListing } from '#tests/helpers/mock_drive_listing';

test.group('ListBackupsAction', (group) => {
	group.each.setup(() => {
		drive.fake(backupConfig.storage.disk as any);
		const disk = drive.use(backupConfig.storage.disk) as any;
		mockDriveListing(disk);
	});

	group.each.teardown(() => {
		drive.restore(backupConfig.storage.disk as any);
	});

	test('execute() returns empty array when no backups exist', async ({ assert }) => {
		const action = await app.container.make(ListBackupsAction);
		const result = await action.execute();
		assert.isArray(result);
		assert.lengthOf(result, 0);
	});

	test('execute() lists backup files sorted by date descending', async ({ assert }) => {
		const disk = drive.use(backupConfig.storage.disk) as any;
		const prefix = backupConfig.storage.prefix;

		await disk.put(`${prefix}/backup-full-2024-01-15-143022.sql.gz.enc`, 'dummy content');
		await disk.put(`${prefix}/backup-differential-2024-01-16-100000.sql`, 'dummy');

		const action = await app.container.make(ListBackupsAction);
		const result = await action.execute();

		assert.lengthOf(result, 2);

		// Verify both backup types are present (order-independent assertion to avoid flakiness)
		const types = result.map((b) => b.type);
		assert.include(types, 'full');
		assert.include(types, 'differential');

		// Verify descending date order: the differential (Jan 16) must come before full (Jan 15)
		assert.isBelow(
			result[1].createdAt.getTime(),
			result[0].createdAt.getTime(),
			'Backups should be sorted newest first',
		);
	});

	test('execute() filters by type when specified', async ({ assert }) => {
		const disk = drive.use(backupConfig.storage.disk) as any;
		const prefix = backupConfig.storage.prefix;

		await disk.put(`${prefix}/backup-full-2024-01-15-143022.sql.gz.enc`, 'dummy');
		await disk.put(`${prefix}/backup-differential-2024-01-16-100000.sql`, 'dummy');

		const action = await app.container.make(ListBackupsAction);
		const result = await action.execute({ type: 'full' });

		assert.lengthOf(result, 1);
		assert.equal(result[0].type, 'full');
	});
});
