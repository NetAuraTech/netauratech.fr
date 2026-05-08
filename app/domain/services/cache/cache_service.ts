import { type CacheDriver } from '#contracts/cache/cache_driver'

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
    private readonly prefix: string = ''
  ) {}

  // ─── Key helpers ──────────────────────────────────────────────────────────

  private k(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }

  // ─── CacheDriver delegation ───────────────────────────────────────────────

  /**
   * Returns the cached value for `key`, or `null` on miss.
   */
  get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(this.k(key))
  }

  /**
   * Stores `value` under `key` with an optional TTL in seconds.
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.driver.set(this.k(key), value, ttl)
  }

  /**
   * Deletes a key from the cache.
   */
  delete(key: string): Promise<void> {
    return this.driver.delete(this.k(key))
  }

  /**
   * Deletes all keys whose suffix matches a glob pattern within this namespace.
   *
   * @example
   * builderCache.deletePattern('lock:42:*') // deletes builder:lock:42:*
   */
  deletePattern(pattern: string): Promise<void> {
    return this.driver.deletePattern(this.k(pattern))
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
    return this.driver.remember<T>(this.k(key), factory, ttl)
  }

  /**
   * Returns whether the key exists in the cache.
   */
  has(key: string): Promise<boolean> {
    return this.driver.has(this.k(key))
  }

  /**
   * Atomically increments a counter. Returns the new value.
   */
  increment(key: string, by?: number): Promise<number> {
    return this.driver.increment(this.k(key), by)
  }

  /**
   * Flushes **all** keys — delegates directly to the driver.
   * Use with extreme care in production.
   */
  flush(): Promise<void> {
    return this.driver.flush()
  }

  /**
   * Returns all keys matching a glob pattern (namespaced automatically).
   *
   * @example
   * const lock = cache.namespace('builder').namespace('lock')
   * const keys = await lock.keys('42:*')
   * // scans for "builder:lock:42:*", returns ["builder:lock:42:block-1:title", ...]
   */
  keys(pattern: string): Promise<string[]> {
    return this.driver.keys(this.k(pattern))
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
    const newPrefix = this.prefix ? `${this.prefix}:${ns}` : ns
    return new CacheService(this.driver, newPrefix)
  }
}
