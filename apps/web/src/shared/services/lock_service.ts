import { randomUUID } from 'node:crypto';
import logger from '@adonisjs/core/services/logger';
import redis from '@adonisjs/redis/services/main';

/** Key prefix so lock keys never collide with other Redis consumers. */
const KEY_PREFIX = 'lock';

/**
 * Compare-and-delete so only the lock holder can release it. Prevents a slow
 * holder from releasing a lock that has since expired and been re-acquired.
 */
const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0
end
`;

interface MemoryLock {
	token: string;
	expiresAt: number;
}

/**
 * Distributed lock service.
 *
 * Guarantees a named task runs at most once across all worker processes and
 * app instances. The scheduled maintenance jobs use it so an overlapping run
 * (e.g. a manual `logs:prune` firing while the scheduled job is mid-prune) is
 * skipped rather than double-processing.
 *
 * Redis is the primary backend — `SET ... NX EX` is atomic. An in-memory map
 * covers single-process environments (tests, the `sync` queue driver) and is
 * used automatically when Redis is unreachable.
 */
export class LockService {
	private readonly memoryLocks = new Map<string, MemoryLock>();
	private redisAvailable: boolean;

	/**
	 * @param allowRedis - When `false`, always use the in-memory backend. Used
	 *   by tests to exercise the fallback hermetically, without Redis.
	 */
	constructor(allowRedis: boolean = true) {
		this.redisAvailable = allowRedis;
	}

	/**
	 * Attempt to acquire the lock named `name` for `ttlSeconds`.
	 *
	 * @param name - A stable, human-readable lock name (e.g. `maintenance:log_prune`).
	 * @param ttlSeconds - How long the lock is held if not explicitly released.
	 * @returns A unique token on success, or `null` when the lock is already held.
	 *
	 * @example
	 * const token = await locks.acquire('maintenance:log_prune', 1800)
	 */
	async acquire(name: string, ttlSeconds: number): Promise<string | null> {
		const token = randomUUID();

		if (this.redisAvailable) {
			try {
				const result = await redis.connection().set(this.key(name), token, 'EX', ttlSeconds, 'NX');
				return result === 'OK' ? token : null;
			} catch (error) {
				this.redisAvailable = false;
				logger.warn({ error }, '[LockService] Redis unavailable, falling back to in-memory locks.');
			}
		}

		return this.memoryAcquire(name, token, ttlSeconds);
	}

	/**
	 * Release a previously acquired lock. Only the holder (matching `token`)
	 * can release it; a lock held by someone else is left untouched.
	 *
	 * @param name - The lock name passed to {@link acquire}.
	 * @param token - The token returned by {@link acquire}.
	 */
	async release(name: string, token: string): Promise<void> {
		if (this.redisAvailable) {
			try {
				await redis.connection().eval(RELEASE_SCRIPT, 1, this.key(name), token);
				return;
			} catch {
				this.redisAvailable = false;
			}
		}

		this.memoryRelease(name, token);
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

	private key(name: string): string {
		return `${KEY_PREFIX}:${name}`;
	}

	private memoryAcquire(name: string, token: string, ttlSeconds: number): string | null {
		const now = Date.now();
		const existing = this.memoryLocks.get(name);
		if (existing && existing.expiresAt > now) {
			return null;
		}

		this.memoryLocks.set(name, { token, expiresAt: now + ttlSeconds * 1000 });
		return token;
	}

	private memoryRelease(name: string, token: string): void {
		const existing = this.memoryLocks.get(name);
		if (existing && existing.token === token) {
			this.memoryLocks.delete(name);
		}
	}
}

export default LockService;
