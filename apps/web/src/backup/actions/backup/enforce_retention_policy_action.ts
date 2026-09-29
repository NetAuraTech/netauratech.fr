import { inject } from '@adonisjs/core';
import drive from '@adonisjs/drive/services/main';
import { DateTime } from 'luxon';
import { BackupMetadata } from '#backup/domain/backup';
import { ListBackupsQuery } from '#backup/queries/list_backups_query';
import backupConfig from '#config/backup';
import { LogService } from '#log/services/log_service';
import { LogCategory } from '#log/types/logging';

export interface RetentionPolicyResult {
	/** Filenames of backups that were successfully deleted. */
	deleted: string[];
	kept: number;
}

interface EnforceRetentionPayload {
	daily?: number;
	weekly?: number;
	monthly?: number;
	yearly?: number;
}

/**
 * Enforce backup retention policy by deleting backups that fall outside the
 * configured retention windows.
 *
 * - **Daily** — keep all backups newer than `daily` days.
 * - **Weekly** — keep one backup per week (Sunday, weekday=7) for `weekly` weeks.
 * - **Monthly** — keep one backup per month (1st of month) for `monthly` months.
 * - **Yearly** — keep one backup per year (Jan 1st) for `yearly` years.
 */
@inject()
export class EnforceRetentionPolicyAction {
	constructor(
		protected logService: LogService,
		protected listBackupsQuery: ListBackupsQuery,
	) {}

	private getDisk() {
		return drive.use(backupConfig.storage.disk as Parameters<typeof drive.use>[0]);
	}

	private buildPath(filename: string): string {
		return `${backupConfig.storage.prefix}/${filename}`;
	}

	/**
	 * Execute retention policy enforcement.
	 *
	 * @param payload - Optional override for the retention counts per period.
	 *   Falls back to config defaults.
	 * @returns A result object with the counts of deleted, kept, and errored backups.
	 *
	 * @example
	 * const result = await enforceRetentionAction.execute({ daily: 7, weekly: 4 })
	 */
	async execute(payload?: EnforceRetentionPayload): Promise<RetentionPolicyResult> {
		const retention = {
			daily: payload?.daily ?? backupConfig.retention.daily,
			weekly: payload?.weekly ?? backupConfig.retention.weekly,
			monthly: payload?.monthly ?? backupConfig.retention.monthly,
			yearly: payload?.yearly ?? backupConfig.retention.yearly,
		};

		this.logService.info({
			message: 'Starting backup cleanup',
			category: LogCategory.SYSTEM,
		});

		let deleted: string[] = [];
		let kept = 0;
		let errors = 0;

		try {
			const disk = this.getDisk();
			const backups = await this.listBackupsQuery.execute();
			const toDelete = this.getBackupsToDelete(backups, retention);

			for (const backup of toDelete) {
				try {
					await disk.delete(this.buildPath(backup.filename));
					deleted.push(backup.filename);
					this.logService.debug({
						message: 'Backup deleted',
						category: LogCategory.SYSTEM,
						metadata: { filename: backup.filename },
					});
				} catch (error) {
					errors++;
					this.logService.error({
						message: 'Failed to delete backup',
						category: LogCategory.SYSTEM,
						error,
						metadata: { filename: backup.filename },
					});
				}
			}

			kept = backups.length - toDelete.length;
		} catch (error) {
			this.logService.error({
				message: 'Failed to cleanup backups',
				category: LogCategory.SYSTEM,
				error,
			});
		}

		this.logService.info({
			message: 'Backup cleanup completed',
			category: LogCategory.SYSTEM,
			metadata: { deleted: deleted.length, kept, errors },
		});

		return { deleted, kept };
	}

	/**
	 * Applies the retention windows and returns backups that should be deleted.
	 *
	 * Matches BackupService.getBackupsToDelete exactly:
	 * - Daily: time-window check (newer than N days), not a count.
	 * - Weekly: Sunday (weekday === 7 in Luxon ISO), within N weeks, capped at N.
	 * - Monthly: 1st of month, within N months, capped at N.
	 * - Yearly: Jan 1st, within N years, capped at N.
	 */
	private getBackupsToDelete(
		backups: BackupMetadata[],
		retention: { daily: number; weekly: number; monthly: number; yearly: number },
	): BackupMetadata[] {
		const now = DateTime.now();
		const toKeep = new Set<string>();

		const sorted = [...backups].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

		const dailyBackups = sorted.filter((b) => DateTime.fromJSDate(b.createdAt) > now.minus({ days: retention.daily }));
		dailyBackups.forEach((b) => toKeep.add(b.filename));

		const weeklyBackups = sorted
			.filter((b) => {
				const date = DateTime.fromJSDate(b.createdAt);
				return date.weekday === 7 && date > now.minus({ weeks: retention.weekly });
			})
			.slice(0, retention.weekly);
		weeklyBackups.forEach((b) => toKeep.add(b.filename));

		const monthlyBackups = sorted
			.filter((b) => {
				const date = DateTime.fromJSDate(b.createdAt);
				return date.day === 1 && date > now.minus({ months: retention.monthly });
			})
			.slice(0, retention.monthly);
		monthlyBackups.forEach((b) => toKeep.add(b.filename));

		const yearlyBackups = sorted
			.filter((b) => {
				const date = DateTime.fromJSDate(b.createdAt);
				return date.month === 1 && date.day === 1 && date > now.minus({ years: retention.yearly });
			})
			.slice(0, retention.yearly);
		yearlyBackups.forEach((b) => toKeep.add(b.filename));

		return sorted.filter((b) => !toKeep.has(b.filename));
	}
}
