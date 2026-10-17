import { inject } from '@adonisjs/core';
import drive from '@adonisjs/drive/services/main';
import { BackupMetadata } from '#backup/domain/backup';
import { BackupPipeline } from '#backup/services/backup_pipeline';
import backupConfig from '#config/backup';
import { LogService } from '#log/services/log_service';
import { LogCategory } from '#log/types/logging';

export interface HealthCheckResult {
	healthy: boolean;
	issues: string[];
	/** Most recent backup metadata, or `null` if no backups exist. */
	lastBackup: BackupMetadata | null;
	/** Age of the most recent backup in hours. `Infinity` when no backups exist. */
	lastBackupAgeHours: number;
	/** Total number of backup archives found in storage. */
	totalBackups: number;
	/** Sum of all backup archive sizes in bytes. */
	totalSizeBytes: number;
	storage: { disk: string; available: boolean };
}

interface HealthCheckPayload {
	maxAgeDays?: number;
}

/**
 * Run a health check on the backup storage, reporting age, availability, and issues.
 */
@inject()
export class HealthCheckBackupAction {
	constructor(protected logService: LogService) {}

	/**
	 * Execute the health check.
	 *
	 * Checks performed:
	 * - Storage availability (Drive ping via `listAll`).
	 * - Age of the most recent backup against `maxBackupAge` (in **hours**).
	 *
	 * @param payload - Optional override for the max age threshold in days.
	 *   Falls back to `backupConfig.health.maxBackupAge` (hours).
	 * @returns A {@link HealthCheckResult} with a `healthy` flag, `issues` array,
	 *   `lastBackup` metadata, and storage availability status.
	 *
	 * @example
	 * const { healthy, issues } = await healthCheckAction.execute()
	 */
	async execute(payload?: HealthCheckPayload): Promise<HealthCheckResult> {
		const issues: string[] = [];
		let available = false;

		try {
			const disk = drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0]);
			await disk.listAll(`${backupConfig.storage.prefix}/`);
			available = true;
		} catch {
			issues.push(`Storage disk "${backupConfig.storage.disk}" is not available`);
		}

		const backups = await new BackupPipeline(this.logService).list();
		let lastBackup: BackupMetadata | null = null;
		let lastBackupAgeHours = Infinity;
		const totalBackups = backups.length;
		const totalSizeBytes = backups.reduce((sum, b) => sum + b.size, 0);

		if (backups.length > 0) {
			lastBackup = backups[0];

			const maxAgeHours =
				payload?.maxAgeDays !== undefined ? payload.maxAgeDays * 24 : backupConfig.health.maxBackupAge;

			lastBackupAgeHours = (Date.now() - lastBackup.createdAt.getTime()) / (1000 * 60 * 60);

			if (lastBackupAgeHours > maxAgeHours) {
				issues.push(`Last backup is too old: ${lastBackupAgeHours.toFixed(1)} hours (max: ${maxAgeHours} hours)`);
			}
		} else {
			issues.push('No backups found');
		}

		const healthy = issues.length === 0;

		if (!healthy && backupConfig.notifications.onHealthCheckFailure) {
			this.logService.error({
				message: 'Backup health check failed',
				category: LogCategory.SYSTEM,
				metadata: { issues },
			});
		}

		return {
			healthy,
			issues,
			lastBackup,
			lastBackupAgeHours,
			totalBackups,
			totalSizeBytes,
			storage: { disk: backupConfig.storage.disk, available },
		};
	}
}
