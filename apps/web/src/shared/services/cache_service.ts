import { type CacheDriver } from '#core/contracts/cache_driver';

/**
 * Application-wide cache service.
 *
 * Acts as a typed facade over any `CacheDriver` implementation. The driver
 * is injected at construction time via the IoC container (see
 * `start/container.ts`), so swapping Redis for another backend only requires
 * changing the binding — no call sites need to change.
 *
 * **Namespacing**
 * Use `CacheService.namespace()` to get a scoped instance that automatically
 * prefixes all keys:
 *
 * @example
 * const builderCache = cache.namespace('builder')
 * await builderCache.set('session:42:1', session, 3600)
 * // stored as "builder:session:42:1"
 *
 * @example
 * const pageCache = cache.namespace('page')
 * const slug = await pageCache.remember(`slug:${id}`, () => repo.findSlug(id), 300)
 */
export class CacheService {
	constructor(
		private readonly driver: CacheDriver,
		private readonly prefix: string = '',
	) {}

	// ─── Key helpers ──────────────────────────────────────────────────────────

	private k(key: string): string {
		return this.prefix ? `${this.prefix}:${key}` : key;
	}

	// ─── CacheDriver delegation ───────────────────────────────────────────────

	/**
	 * Returns the cached value for `key`, or `null` on miss.
	 */
	get<T>(key: string): Promise<T | null> {
		return this.driver.get<T>(this.k(key));
	}

	/**
	 * Stores `value` under `key` with an optional TTL in seconds.
	 */
	set<T>(key: string, value: T, ttl?: number): Promise<void> {
		return this.driver.set(this.k(key), value, ttl);
	}

	/**
	 * Deletes a key from the cache.
	 */
	delete(key: string): Promise<void> {
		return this.driver.delete(this.k(key));
	}

	/**
	 * Deletes all keys whose suffix matches a glob pattern within this namespace.
	 *
	 * @example
	 * builderCache.deletePattern('lock:42:*') // deletes builder:lock:42:*
	 */
	deletePattern(pattern: string): Promise<void> {
		return this.driver.deletePattern(this.k(pattern));
	}

	/**
	 * Get-or-set. Returns cached value if present, otherwise calls `factory`,
	 * caches the result, and returns it.
	 *
	 * @param key     - Cache key (namespaced automatically)
	 * @param factory - Async producer called on cache miss
	 * @param ttl     - Time-to-live in seconds
	 */
	remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		return this.driver.remember<T>(this.k(key), factory, ttl);
	}

	/**
	 * Returns whether the key exists in the cache.
	 */
	has(key: string): Promise<boolean> {
		return this.driver.has(this.k(key));
	}

	/**
	 * Atomically increments a counter. Returns the new value.
	 */
	increment(key: string, by?: number): Promise<number> {
		return this.driver.increment(this.k(key), by);
	}

	/**
	 * Flushes **all** keys — delegates directly to the driver.
	 * Use with extreme care in production.
	 */
	flush(): Promise<void> {
		return this.driver.flush();
	}

	/**
	 * Returns all keys matching a glob pattern (namespaced automatically).
	 *
	 * **Note:** returns *absolute* keys (with the namespace prefix), unlike
	 * {@link list} which returns values under the namespaced key dialect.
	 *
	 * @example
	 * const lock = cache.namespace('builder').namespace('lock')
	 * const keys = await lock.keys('42:*')
	 * // scans for "builder:lock:42:*", returns ["builder:lock:42:block-1:title", ...]
	 */
	keys(pattern: string): Promise<string[]> {
		return this.driver.keys(this.k(pattern));
	}

	/**
	 * Returns the decoded values of all keys matching a glob pattern within
	 * this namespace (namespaced automatically), as a map of key → value.
	 *
	 * Unlike {@link keys} — which returns absolute keys — the returned map
	 * uses the same key dialect as `get()`/`set()`, so entries can be re-read,
	 * updated or deleted with the returned keys directly, with no prefix
	 * bookkeeping.
	 *
	 * @example
	 * const lock = cache.namespace('builder').namespace('lock')
	 * const locks = await lock.list<Lock>('42:*')
	 * // { '42:block-1:title': { blockId: 'block-1', ... }, ... }
	 */
	list<T>(pattern: string): Promise<Record<string, T>> {
		return this.driver.list<T>(this.k(pattern)).then((entries) => {
			const values: Record<string, T> = {};
			for (const [key, value] of Object.entries(entries)) {
				values[this.prefix ? key.slice(this.prefix.length + 1) : key] = value;
			}
			return values;
		});
	}

	/**
	 * Atomically stores `value` under `key` only if no live value is present
	 * (namespaced automatically).
	 *
	 * @returns `true` when the value was stored, `false` when the key already
	 *   existed and was left untouched.
	 */
	setIfAbsent<T>(key: string, value: T, ttl?: number): Promise<boolean> {
		return this.driver.setIfAbsent<T>(this.k(key), value, ttl);
	}

	/**
	 * Atomically replaces the value at `key` with `value` (and refreshes its
	 * TTL) only if the stored value still equals `expected`
	 * (namespaced automatically).
	 *
	 * @returns `true` when the swap happened, `false` when the stored value
	 *   had changed (or the key was missing) and was left untouched.
	 */
	compareAndSet<T>(key: string, expected: T, value: T, ttl?: number): Promise<boolean> {
		return this.driver.compareAndSet<T>(this.k(key), expected, value, ttl);
	}

	/**
	 * Atomically deletes `key` only if the stored value still equals
	 * `expected` (namespaced automatically).
	 *
	 * @returns `true` when the key was deleted, `false` when the stored value
	 *   had changed (or the key was missing) and was left untouched.
	 */
	compareAndDelete<T>(key: string, expected: T): Promise<boolean> {
		return this.driver.compareAndDelete<T>(this.k(key), expected);
	}

	// ─── Namespace factory ────────────────────────────────────────────────────

	/**
	 * Returns a new `CacheService` instance whose keys are automatically
	 * prefixed with `<current prefix>:<ns>`.
	 *
	 * Namespaces can be nested:
	 * @example
	 * const root = new CacheService(driver)          // prefix: ""
	 * const builder = root.namespace('builder')       // prefix: "builder"
	 * const lock = builder.namespace('lock')          // prefix: "builder:lock"
	 * await lock.set('42:block-1:title', data, 5)    // key: "builder:lock:42:block-1:title"
	 */
	namespace(ns: string): CacheService {
		const newPrefix = this.prefix ? `${this.prefix}:${ns}` : ns;
		return new CacheService(this.driver, newPrefix);
	}
}
