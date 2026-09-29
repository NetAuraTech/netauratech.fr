import app from '@adonisjs/core/services/app';
import { EnforceBackupRetentionJob } from '#backup/jobs/enforce_backup_retention_job';
import maintenanceConfig from '#config/maintenance';
import { PruneLogEntriesJob } from '#log/jobs/prune_log_entries_job';

/**
 * Register the automated maintenance schedules with the queue.
 *
 * Each task is scheduled on its configured interval; a disabled task (zero
 * interval) is skipped. Safe to call repeatedly — schedules are upserted by a
 * stable id, so re-registration (e.g. on every app restart) updates the
 * existing schedule rather than creating a duplicate.
 *
 * @param config - The maintenance configuration (defaults to `config/maintenance.ts`).
 *
 * @example
 * await registerMaintenanceSchedules()
 */
export async function registerMaintenanceSchedules(
	config: typeof maintenanceConfig = maintenanceConfig,
): Promise<void> {
	const { logPrune, backupRetention } = config.schedules;

	if (logPrune.enabled) {
		await PruneLogEntriesJob.schedule({}).id('maintenance:log_prune').every(logPrune.interval).run();
	}

	if (backupRetention.enabled) {
		await EnforceBackupRetentionJob.schedule({})
			.id('maintenance:backup_retention')
			.every(backupRetention.interval)
			.run();
	}
}

/**
 * Register the maintenance schedules once the app has booted, when the queue
 * adapter is available. This runs at import time of this preload (the app is
 * already booted by then, so the `booted` hook fires immediately).
 */
await app.booted(async () => {
	await registerMaintenanceSchedules();
});
