import { BaseCommand } from '@adonisjs/core/ace';
import { DateTime } from 'luxon';
import { HealthCheckBackupAction } from '#backup/actions/backup/health_check_backup_action';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Ace command that runs a health check on the backup system and reports
 * any detected issues.
 *
 * Checks performed:
 * - Availability of each configured storage adapter.
 * - Free disk space on local storage vs. the configured minimum.
 * - Age of the most recent backup vs. the configured maximum.
 *
 * Exits with code `1` if any issue is detected, making this command
 * suitable for use in monitoring pipelines and cron job alerts.
 *
 * @example
 * node ace backup:health-check
 */
export default class BackupHealthCheck extends BaseCommand {
	static commandName = 'backup:health-check';
	static description = 'Check backup system health and alert if issues found';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	async run() {
		const healthCheckBackupAction = await this.app.container.make(HealthCheckBackupAction);

		this.logger.info('Running backup health check...');

		try {
			const result = await healthCheckBackupAction.execute();

			if (result.issues.length === 0) {
				this.logger.success('? Backup system is healthy!');
			} else {
				this.logger.error('? Backup system has issues:');
				for (const issue of result.issues) {
					this.logger.error(`  - ${issue}`);
				}
				this.exitCode = 1;
			}

			this.logger.info('');
			this.logger.info(`Total backups: ${result.totalBackups}`);
			this.logger.info(`Total size: ${(result.totalSizeBytes / 1024 / 1024).toFixed(2)} MB`);

			if (result.lastBackup) {
				this.logger.info('');
				this.logger.info('Last Backup:');
				this.logger.info(
					`  Created: ${DateTime.fromJSDate(result.lastBackup.createdAt).toLocaleString(DateTime.DATETIME_MED)}`,
				);
				this.logger.info(`  Age: ${result.lastBackupAgeHours.toFixed(1)} hours ago`);
			} else {
				this.logger.warning('');
				this.logger.warning('No backups found!');
			}
		} catch (error) {
			this.logger.fatal('Unexpected error during health check');
			this.logger.fatal(error.message);
			if (error.stack) {
				this.logger.debug(error.stack);
			}
			this.exitCode = 1;
		}
	}
}
