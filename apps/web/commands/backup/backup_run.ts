import { BaseCommand, flags } from '@adonisjs/core/ace';
import { RunBackupAction } from '#backup/actions/backup/run_backup_action';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Ace command that triggers a database backup via {@link RunBackupAction}.
 *
 * When `--type` is omitted, the backup type is auto-detected based on
 * the configured `fullBackupDay` schedule � full on the designated weekday,
 * differential on all others. Passing `--type` forces a specific strategy
 * regardless of the schedule.
 *
 * @example
 * node ace backup:run
 * node ace backup:run --type=full
 * node ace backup:run --type=differential
 */
export default class BackupRun extends BaseCommand {
	static commandName = 'backup:run';
	static description = 'Run database backup (auto-detects type based on schedule or specify --type)';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	/**
	 * Forces a specific backup strategy.
	 * When omitted, the strategy is auto-detected from the schedule.
	 */
	@flags.string({
		description: 'Backup type (full or differential). Auto-detected if not specified.',
	})
	declare type?: 'full' | 'differential';

	async run() {
		const runBackupAction = await this.app.container.make(RunBackupAction);

		this.logger.info('Starting database backup...');

		try {
			let result;

			if (this.type === 'full') {
				this.logger.info('Running FULL backup (forced)');
				result = await runBackupAction.execute({ strategy: 'full' });
			} else if (this.type === 'differential') {
				this.logger.info('Running DIFFERENTIAL backup (forced)');
				result = await runBackupAction.execute({ strategy: 'differential' });
			} else {
				this.logger.info('Auto-detecting backup type based on schedule...');
				result = await runBackupAction.execute();
			}

			if (result.success) {
				this.logger.success('Backup completed successfully!');
				this.logger.info(`  Filename: ${result.filename}`);
				this.logger.info(`  Type: ${result.type}`);
				this.logger.info(`  Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
				this.logger.info(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);
				this.logger.info(`  Storage: ${result.storage}`);
			} else {
				this.logger.error('Backup failed!');
				this.logger.error(`  Error: ${result.error}`);
				this.exitCode = 1;
			}
		} catch (error) {
			this.logger.fatal('Unexpected error during backup');
			this.logger.fatal(error.message);
			if (error.stack) {
				this.logger.debug(error.stack);
			}
			this.exitCode = 1;
		}
	}
}
