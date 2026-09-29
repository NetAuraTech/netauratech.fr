import { LogLevel } from '#log/types/logging';
import env from '#start/env';

/**
 * Configuration for the database persistence side of the logging pipeline.
 *
 * The `LogService` write-through hooks consult this configuration to decide
 * which log entries are worth persisting to the `log_entries` table.
 */
const loggingConfig = {
	/**
	 * Database persistence of log entries.
	 */
	persistence: {
		/**
		 * Minimum log level persisted to the database.
		 *
		 * Entries at or above this level are stored; entries below it are
		 * dropped (unless they belong to a security-relevant category, see
		 * `excludeDebugNoise`).
		 */
		minLevel: LogLevel.INFO,

		/**
		 * When `true`, `debug` entries from noisy categories (`api`,
		 * `database`, `performance`) are never persisted, regardless of
		 * `minLevel`. Security-relevant categories (`security`, `business`)
		 * are always persisted regardless of level.
		 */
		excludeDebugNoise: true,

		/**
		 * Soft cap on the number of rows kept in the `log_entries` table.
		 *
		 * The retention command (`logs:prune`) uses this value to know how many
		 * entries to keep. It is declared here so that ops can tune it without
		 * touching code.
		 */
		maxEntries: 100_000,

		/**
		 * Retention window in days: entries older than this are pruned by the
		 * `logs:prune` command and the scheduled log-prune job. Tunable via
		 * `LOG_RETENTION_DAYS`.
		 */
		retentionDays: env.get('LOG_RETENTION_DAYS', 180),
	},
};

export default loggingConfig;
