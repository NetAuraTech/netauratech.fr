import { BaseCommand } from '@adonisjs/core/ace';
import { EnforceRetentionPolicyAction } from '#backup/actions/backup/enforce_retention_policy_action';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Ace command that enforces the retention policy by deleting backups that
 * fall outside the configured daily, weekly, monthly, and yearly windows.
 *
 * Exits with code `1` if any deletion errors occurred during cleanup,
 * even when some backups were successfully removed.
 *
 * @example
 * node ace backup:cleanup
 */
export default class BackupCleanup extends BaseCommand {
	static commandName = 'backup:cleanup';
	static description = 'Clean up old backups based on retention policy';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	async run() {
		const enforceRetentionPolicyAction = await this.app.container.make(EnforceRetentionPolicyAction);

		this.logger.info('Starting backup cleanup...');

		try {
			const result = await enforceRetentionPolicyAction.execute();

			this.logger.success('Cleanup completed!');
			this.logger.info(`  Deleted: ${result.deleted.length} backup(s)`);
			this.logger.info(`  Kept: ${result.kept} backup(s)`);

			if (result.deleted.length > 0) {
				for (const filename of result.deleted) {
					this.logger.info(`    - ${filename}`);
				}
			}
		} catch (error) {
			this.logger.fatal('Unexpected error during cleanup');
			this.logger.fatal(error.message);
			if (error.stack) {
				this.logger.debug(error.stack);
			}
			this.exitCode = 1;
		}
	}
}
