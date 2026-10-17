import { randomUUID } from 'node:crypto';
import { CacheService } from '#shared/services/cache_service';

/** Key prefix so lock keys never collide with other cache consumers. */
const KEY_PREFIX = 'lock';

/**
 * Distributed lock service.
 *
 * Guarantees a named task runs at most once across all worker processes and
 * app instances. The scheduled maintenance jobs use it so an overlapping run
 * (e.g. a manual `logs:prune` firing while the scheduled job is mid-prune) is
 * skipped rather than double-processing. This is the canonical lock for named
 * jobs and maintenance tasks; the CMS builder's per-field editor locks live in
 * `BuilderSessionService` (a different granularity, deliberately separate).
 *
 * Built on the cache seam: acquire is an atomic `setIfAbsent` and release an
 * atomic `compareAndDelete` on a `lock` namespace, so no lock algorithm — and
 * no Lua — lives outside the drivers. Failover from the primary tier to the
 * process-local tier is handled by the injected driver; in production the
 * root {@link CacheService} binding wraps the composite failover driver
 * (see `start/container.ts` and ADR-012).
 */
export class LockService {
	private readonly locks: CacheService;

	/**
	 * @param cache - The cache seam the locks are stored in. Production passes
	 *   the root `CacheService` (composite failover driver); tests can inject
	 *   a hermetic instance backed by another driver.
	 */
	constructor(cache: CacheService) {
		this.locks = cache.namespace(KEY_PREFIX);
	}

	/**
	 * Attempt to acquire the lock named `name` for `ttlSeconds`.
	 *
	 * @param name - A stable, human-readable lock name (e.g. `maintenance:log_prune`).
	 * @param ttlSeconds - How long the lock is held if not explicitly released.
	 *   A value of `0` (or one below) holds the lock until it is released.
	 * @returns A unique token on success, or `null` when the lock is already held.
	 *
	 * @example
	 * const token = await locks.acquire('maintenance:log_prune', 1800)
	 */
	async acquire(name: string, ttlSeconds: number): Promise<string | null> {
		const token = randomUUID();
		const acquired = await this.locks.setIfAbsent(name, token, ttlSeconds);
		return acquired ? token : null;
	}

	/**
	 * Release a previously acquired lock. Only the holder (matching `token`)
	 * can release it; a lock held by someone else is left untouched.
	 *
	 * @param name - The lock name passed to {@link acquire}.
	 * @param token - The token returned by {@link acquire}.
	 */
	async release(name: string, token: string): Promise<void> {
		await this.locks.compareAndDelete(name, token);
	}

	/**
	 * Run `fn` while holding the lock named `name`, releasing it afterwards even
	 * if `fn` throws.
	 *
	 * @param name - A stable, human-readable lock name.
	 * @param ttlSeconds - How long the lock is held if not explicitly released.
	 * @param fn - The critical section to run under the lock.
	 * @returns `true` when the lock was acquired and `fn` ran, `false` when the
	 *   lock was already held and `fn` was skipped.
	 *
	 * @example
	 * const ran = await locks.withLock('maintenance:log_prune', 1800, () => runPrune())
	 */
	async withLock<T>(name: string, ttlSeconds: number, fn: () => Promise<T>): Promise<boolean> {
		const token = await this.acquire(name, ttlSeconds);
		if (token === null) {
			return false;
		}

		try {
			await fn();
			return true;
		} finally {
			await this.release(name, token);
		}
	}
}

export default LockService;
