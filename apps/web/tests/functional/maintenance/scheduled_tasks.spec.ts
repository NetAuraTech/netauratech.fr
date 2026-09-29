import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import drive from '@adonisjs/drive/services/main';
import { QueueManager, Schedule } from '@adonisjs/queue';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { EnforceBackupRetentionJob } from '#backup/jobs/enforce_backup_retention_job';
import backupConfig from '#config/backup';
import loggingConfig from '#config/logging';
import maintenanceConfig, { resolveSchedule } from '#config/maintenance';
import { LogEntryFactory } from '#factories/log/log_entry_factory';
import { PruneLogEntriesJob } from '#log/jobs/prune_log_entries_job';
import LogEntry from '#log/models/log_entry';
import { LockService } from '#shared/services/lock_service';
import { registerMaintenanceSchedules } from '#start/scheduler';
import { mockDriveListing } from '#tests/helpers/mock_drive_listing';
import { resetSharedState } from '#tests/helpers/shared_state';

/**
 * Functional seam for the scheduled maintenance tasks (issue #287).
 *
 * Covers the whole pipeline end to end, on the sync driver (jobs execute
 * inline in the test process):
 *
 * - **registration** — `registerMaintenanceSchedules()` upserts one schedule
 *   per task on its configured interval; a zero interval disables the task.
 *   Schedules are asserted through the fake driver, which — unlike the sync
 *   driver — records them in memory.
 * - **log pruning** — dispatching {@link PruneLogEntriesJob} prunes entries
 *   older than the retention window, and is a no-op while its lock is held.
 * - **backup retention** — dispatching {@link EnforceBackupRetentionJob}
 *   deletes backups outside the retention windows, and is a no-op while its
 *   lock is held.
 */
test.group('Scheduled maintenance registration', (group) => {
	group.each.setup(resetSharedState);
	group.each.teardown(() => QueueManager.restore());

	test('registers both tasks on their configured intervals', async ({ assert }) => {
		QueueManager.fake();

		await registerMaintenanceSchedules();

		const logPrune = await Schedule.find('maintenance:log_prune');
		assert.exists(logPrune);
		assert.equal(logPrune!.name, 'PruneLogEntriesJob');
		assert.equal(logPrune!.everyMs, maintenanceConfig.schedules.logPrune.intervalMs);
		assert.equal(logPrune!.status, 'active');
		assert.isTrue(logPrune!.nextRunAt!.getTime() > Date.now());

		const backupRetention = await Schedule.find('maintenance:backup_retention');
		assert.exists(backupRetention);
		assert.equal(backupRetention!.name, 'EnforceBackupRetentionJob');
		assert.equal(backupRetention!.everyMs, maintenanceConfig.schedules.backupRetention.intervalMs);
		assert.equal(backupRetention!.status, 'active');
	});

	test('re-registration upserts the same schedules without duplicates', async ({ assert }) => {
		QueueManager.fake();

		await registerMaintenanceSchedules();
		await registerMaintenanceSchedules();

		const schedules = await Schedule.list();
		assert.equal(schedules.length, 2);
	});

	test('a zero interval disables the task without registering a schedule', async ({ assert }) => {
		QueueManager.fake();

		await registerMaintenanceSchedules({
			schedules: {
				logPrune: resolveSchedule('0', '1d'),
				backupRetention: resolveSchedule('0', '1d'),
			},
			lockTtlSeconds: maintenanceConfig.lockTtlSeconds,
		});

		assert.equal((await Schedule.list()).length, 0);
	});
});

test.group('Scheduled maintenance log pruning', (group) => {
	group.each.setup(() => testUtils.db().truncate());
	group.each.setup(resetSharedState);

	test('dispatch prunes entries older than the retention window', async ({ assert }) => {
		const cutoff = DateTime.now().minus({ days: loggingConfig.persistence.retentionDays + 30 });
		const oldEntries = await Promise.all([0, 1, 2].map(() => LogEntryFactory.merge({ createdAt: cutoff }).create()));
		const recentEntries = await Promise.all([0, 1].map(() => LogEntryFactory.create()));

		await PruneLogEntriesJob.dispatch({});

		const remainingIds = (
			await LogEntry.query().whereIn(
				'id',
				[...oldEntries, ...recentEntries].map((e) => e.id),
			)
		)
			.map((e) => e.id)
			.sort();
		assert.deepEqual(remainingIds, recentEntries.map((e) => e.id).sort());
	});

	test('dispatch is a no-op while the maintenance lock is held', async ({ assert }) => {
		const lockService = await app.container.make(LockService);
		const token = await lockService.acquire('maintenance:log_prune', 60);
		assert.exists(token);

		const cutoff = DateTime.now().minus({ days: loggingConfig.persistence.retentionDays + 30 });
		const oldEntry = await LogEntryFactory.merge({ createdAt: cutoff }).create();

		await PruneLogEntriesJob.dispatch({});

		assert.exists(await LogEntry.find(oldEntry.id));
		await lockService.release('maintenance:log_prune', token!);
	});
});

test.group('Scheduled maintenance backup retention', (group) => {
	group.each.setup(resetSharedState);
	group.each.setup(() => {
		drive.fake(backupConfig.storage.disk as any);
		mockDriveListing(drive.use(backupConfig.storage.disk) as any);
	});
	group.each.teardown(() => drive.restore(backupConfig.storage.disk as any));

	test('dispatch deletes backups outside the retention windows', async ({ assert }) => {
		const disk = drive.use(backupConfig.storage.disk) as any;
		const prefix = backupConfig.storage.prefix;
		const oldFull = `backup-full-2024-01-15-143022.sql.gz.enc`;
		const oldDifferential = `backup-differential-2024-02-20-100000.sql.gz.enc`;
		const recent = `backup-differential-${DateTime.now().toFormat('yyyy-MM-dd')}-020000.sql.gz.enc`;

		await disk.put(`${prefix}/${oldFull}`, 'old full backup');
		await disk.put(`${prefix}/${oldDifferential}`, 'old differential backup');
		await disk.put(`${prefix}/${recent}`, 'recent backup');

		await EnforceBackupRetentionJob.dispatch({});

		assert.isFalse(await disk.exists(`${prefix}/${oldFull}`));
		assert.isFalse(await disk.exists(`${prefix}/${oldDifferential}`));
		assert.isTrue(await disk.exists(`${prefix}/${recent}`));
	});

	test('dispatch is a no-op while the maintenance lock is held', async ({ assert }) => {
		const disk = drive.use(backupConfig.storage.disk) as any;
		const prefix = backupConfig.storage.prefix;
		const oldFull = `backup-full-2024-01-15-143022.sql.gz.enc`;
		await disk.put(`${prefix}/${oldFull}`, 'old full backup');

		const lockService = await app.container.make(LockService);
		const token = await lockService.acquire('maintenance:backup_retention', 60);
		assert.exists(token);

		await EnforceBackupRetentionJob.dispatch({});

		assert.isTrue(await disk.exists(`${prefix}/${oldFull}`));
		await lockService.release('maintenance:backup_retention', token!);
	});
});
