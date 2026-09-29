import { parse as parseDuration } from '@lukeed/ms';
import env from '#start/env';

/**
 * A single scheduled maintenance task.
 */
export interface MaintenanceSchedule {
	/** Whether the task is scheduled (the interval parses to a positive value). */
	enabled: boolean;
	/** The interval string as configured, ready to pass to a schedule's `every()`. */
	interval: string;
	/** The interval in milliseconds (`0` when disabled). */
	intervalMs: number;
}

/**
 * Resolve an env-driven schedule interval into a {@link MaintenanceSchedule}.
 *
 * An unset or blank value falls back to `defaultInterval`. A bare `'0'` (or a
 * value that parses to zero, e.g. `'0s'`) disables the task. A value that does
 * not parse to a duration also falls back to the default rather than
 * producing a malformed (e.g. hot-looping) schedule.
 *
 * @param raw - The raw env value, if any.
 * @param defaultInterval - The interval to use when `raw` is unset, blank, or invalid.
 * @returns The resolved schedule.
 *
 * @example
 * resolveSchedule('30m', '1d') // { enabled: true, interval: '30m', intervalMs: 1800000 }
 * resolveSchedule('0', '1d')   // { enabled: false, interval: '0', intervalMs: 0 }
 */
export function resolveSchedule(raw: string | undefined, defaultInterval: string): MaintenanceSchedule {
	const candidate = raw && raw.trim() !== '' ? raw.trim() : defaultInterval;
	if (candidate === '0') {
		return { enabled: false, interval: candidate, intervalMs: 0 };
	}

	const parsed = parseDuration(candidate);

	if (parsed === undefined) {
		const fallback = parseDuration(defaultInterval) ?? 0;
		return { enabled: fallback > 0, interval: defaultInterval, intervalMs: fallback };
	}

	return { enabled: parsed > 0, interval: candidate, intervalMs: parsed };
}

/**
 * Configuration for the automated maintenance tasks (scheduled queue jobs).
 *
 * Drives {@link registerMaintenanceSchedules} (see `start/scheduler.ts`): each
 * entry is scheduled on its interval or skipped when disabled (zero interval).
 *
 * The schedule intervals are env-driven with sensible daily defaults and can be
 * turned off with a zero interval (`MAINTENANCE_LOG_PRUNE_SCHEDULE=0`).
 */
const maintenanceConfig = {
	schedules: {
		/** Log Entry pruning schedule (`MAINTENANCE_LOG_PRUNE_SCHEDULE`). */
		logPrune: resolveSchedule(env.get('MAINTENANCE_LOG_PRUNE_SCHEDULE'), '1d'),
		/** Backup retention enforcement schedule (`MAINTENANCE_BACKUP_RETENTION_SCHEDULE`). */
		backupRetention: resolveSchedule(env.get('MAINTENANCE_BACKUP_RETENTION_SCHEDULE'), '1d'),
	},
	/**
	 * How long (seconds) a maintenance task holds its execution lock. Kept at or
	 * above the job timeout so the lock never expires while a run is in flight.
	 */
	lockTtlSeconds: 1800,
};

export default maintenanceConfig;
