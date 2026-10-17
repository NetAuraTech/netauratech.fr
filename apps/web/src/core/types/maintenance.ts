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
 * Stored through the cache seam under the `maintenance:config` key (root
 * `CacheService`: composite failover driver with Redis as the primary tier
 * and a process-local in-memory tier as fallback). The `enabled` flag is
 * the admin toggle; `scheduled` optionally arms a maintenance window.
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
