import { BaseCommand, flags } from '@adonisjs/core/ace';
import loggingConfig from '#config/logging';
import { PruneLogEntriesAction } from '#log/actions/log/prune_log_entries_action';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * Ace command that prunes persisted log entries according to the retention
 * policy: entries older than the retention window are deleted, then the
 * `persistence.maxEntries` soft cap from `config/logging.ts` is enforced.
 *
 * Designed to run on a schedule (e.g. a daily cron). The prune itself is
 * logged as a business event so the operation leaves an audit trail.
 *
 * @example
 * node ace logs:prune
 * node ace logs:prune --days=90
 * node ace logs:prune --dry-run
 */
export default class LogsPrune extends BaseCommand {
	static commandName = 'logs:prune';
	static description = 'Delete log entries older than the retention window and enforce the max entries cap';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	@flags.number({
		description: 'Retention window in days — entries older than this are deleted',
		default: loggingConfig.persistence.retentionDays,
	})
	declare days: number;

	@flags.boolean({
		description: 'Only report what would be pruned, without deleting anything',
		default: false,
	})
	declare dryRun: boolean;

	async run() {
		const pruneLogEntriesAction = await this.app.container.make(PruneLogEntriesAction);
		const maxEntries = loggingConfig.persistence.maxEntries;

		try {
			const result = await pruneLogEntriesAction.execute({
				days: this.days,
				maxEntries,
				dryRun: this.dryRun,
			});

			const details =
				`${result.dateCount} older than ${this.days} days ` +
				`(cutoff ${result.cutoff.toISODate()}), ${result.capCount} beyond the ` +
				`${maxEntries} entries cap`;

			if (result.dryRun) {
				this.logger.info(`Dry run — ${result.count} log entries would be pruned (${details})`);
			} else {
				this.logger.success(`Pruned ${result.count} log entries (${details})`);
			}
		} catch (error) {
			this.logger.error(error.message);
			this.logger.debug(error.stack);
			this.exitCode = 1;
		}
	}
}
