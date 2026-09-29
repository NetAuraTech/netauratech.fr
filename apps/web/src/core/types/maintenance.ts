/**
 * Scheduled maintenance window.
 *
 * When `enabled` is `true`, maintenance mode is active automatically while
 * `now` falls within `[startAt, endAt]` (both ISO 8601).
 */
export type MaintenanceSchedule = {
	enabled: boolean;
	startAt: string;
	endAt: string;
};

/**
 * Maintenance configuration — the persisted single source of truth.
 *
 * Stored under the Redis `maintenance:config` key, with an in-memory
 * fallback when Redis is unavailable. The `enabled` flag is the admin
 * toggle; `scheduled` optionally arms a maintenance window.
 */
export type MaintenanceConfig = {
	enabled: boolean;
	message: string;
	allowedIps: string[];
	retryAfter: number;
	source: 'redis' | 'memory';
	scheduled?: MaintenanceSchedule;
};

/**
 * In-memory fallback config with reconciliation tracking.
 *
 * `_explicitlySet` records an admin override made while Redis was down;
 * `_lastRedisSync` is the last successful Redis sync, used to decide
 * whether memory changes must be pushed back on recovery.
 */
export type MemoryConfig = {
	enabled: boolean;
	message: string;
	allowedIps: string[];
	retryAfter: number;
	updatedAt: Date;
	source: 'memory';
	scheduled?: MaintenanceSchedule;
	_explicitlySet: boolean;
	_lastRedisSync?: Date;
};
