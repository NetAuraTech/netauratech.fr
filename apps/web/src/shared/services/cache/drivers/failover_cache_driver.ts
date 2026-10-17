import logger from '@adonisjs/core/services/logger';
import { type CacheDriver, type CacheTier } from '#core/contracts/cache_driver';
import { InMemoryCacheDriver } from './in_memory_cache_driver.js';

/**
 * Composite cache driver with per-call failover.
 *
 * Every operation first tries the `primary` tier; when the primary throws
 * (e.g. Redis unreachable), the same operation is replayed on the `fallback`
 * tier (process-local in-memory by default). The next operation tries the
 * primary again — there is no sticky "primary is down" flag, so recovery is
 * self-healing.
 *
 * Tier transitions are logged once each (a `warn` when falling back, an
 * `info` when the primary comes back), never once per call, so a sustained
 * outage produces exactly two log lines around it.
 *
 * Failover is per-call, not per-value: keys written while the primary is
 * down live in the fallback tier and are not visible from the primary after
 * recovery. Callers needing durability across outages must persist state
 * outside the cache (see ADR-012).
 */
export class FailoverCacheDriver implements CacheDriver {
	private readonly fallback: CacheDriver;

	/**
	 * Last tier that served a successful operation. Used only to log one line
	 * per tier transition — never to short-circuit the primary.
	 */
	private tier: CacheTier = 'primary';

	/**
	 * @param primary - The tier tried first on every operation (Redis in
	 *   production; see `start/container.ts`).
	 * @param fallback - The tier operations are replayed on when the primary
	 *   throws. Defaults to a fresh {@link InMemoryCacheDriver}.
	 */
	constructor(
		private readonly primary: CacheDriver,
		fallback?: CacheDriver,
	) {
		this.fallback = fallback ?? new InMemoryCacheDriver();
	}

	/**
	 * The tier that served the last successful operation. Lets consumers
	 * that must distinguish a primary-served result from a
	 * fallback-served one (the maintenance reconciliation lifecycle, e.g.)
	 * poll the composite between operations — without introducing any
	 * sticky behaviour of their own.
	 */
	get currentTier(): CacheTier {
		return this.tier;
	}

	/**
	 * Returns the cached value for `key`, or `null` if missing / expired.
	 */
	async get<T>(key: string): Promise<T | null> {
		return this.withFailover((tier) => tier.get<T>(key));
	}

	/**
	 * Stores `value` under `key` with an optional TTL in seconds.
	 */
	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		await this.withFailover((tier) => tier.set(key, value, ttl));
	}

	/**
	 * Deletes a single key. No-op if the key does not exist.
	 */
	async delete(key: string): Promise<void> {
		await this.withFailover((tier) => tier.delete(key));
	}

	/**
	 * Deletes all keys matching a glob pattern.
	 */
	async deletePattern(pattern: string): Promise<void> {
		await this.withFailover((tier) => tier.deletePattern(pattern));
	}

	/**
	 * Returns the cached value on hit, otherwise calls `factory`, caches the
	 * result, and returns it.
	 */
	async remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		return this.withFailover((tier) => tier.remember(key, factory, ttl));
	}

	/**
	 * Returns whether a key currently exists in the cache.
	 */
	async has(key: string): Promise<boolean> {
		return this.withFailover((tier) => tier.has(key));
	}

	/**
	 * Atomically increments a numeric counter stored at `key` by `by`.
	 */
	async increment(key: string, by: number = 1): Promise<number> {
		return this.withFailover((tier) => tier.increment(key, by));
	}

	/**
	 * Removes all keys in the cache.
	 */
	async flush(): Promise<void> {
		await this.withFailover((tier) => tier.flush());
	}

	/**
	 * Returns all keys matching a glob pattern.
	 */
	async keys(pattern: string): Promise<string[]> {
		return this.withFailover((tier) => tier.keys(pattern));
	}

	/**
	 * Returns the decoded values of all live keys matching a glob pattern,
	 * as a map of absolute key → value.
	 */
	async list<T>(pattern: string): Promise<Record<string, T>> {
		return this.withFailover((tier) => tier.list<T>(pattern));
	}

	/**
	 * Atomically stores `value` under `key` only if no live value is present.
	 */
	async setIfAbsent<T>(key: string, value: T, ttl?: number): Promise<boolean> {
		return this.withFailover((tier) => tier.setIfAbsent(key, value, ttl));
	}

	/**
	 * Atomically replaces the value at `key` with `value` (and refreshes its
	 * TTL) only if the stored value still equals `expected`.
	 */
	async compareAndSet<T>(key: string, expected: T, value: T, ttl?: number): Promise<boolean> {
		return this.withFailover((tier) => tier.compareAndSet(key, expected, value, ttl));
	}

	/**
	 * Atomically deletes `key` only if the stored value still equals
	 * `expected`.
	 */
	async compareAndDelete<T>(key: string, expected: T): Promise<boolean> {
		return this.withFailover((tier) => tier.compareAndDelete(key, expected));
	}

	/**
	 * Runs `operation` against the primary tier and, when the primary throws,
	 * replays the same operation on the fallback tier. Logs one line per tier
	 * transition (warn on fallback, info on recovery) — never per call.
	 *
	 * Errors thrown by the fallback tier propagate to the caller.
	 */
	private async withFailover<T>(operation: (tier: CacheDriver) => Promise<T>): Promise<T> {
		try {
			const result = await operation(this.primary);
			if (this.tier === 'fallback') {
				logger.info({}, '[FailoverCacheDriver] Primary tier recovered; resuming operations on it.');
			}
			this.tier = 'primary';
			return result;
		} catch (error) {
			if (this.tier !== 'fallback') {
				logger.warn(
					{ error },
					'[FailoverCacheDriver] Primary tier unavailable; falling back to the process-local tier.',
				);
			}
			this.tier = 'fallback';
			return operation(this.fallback);
		}
	}
}
