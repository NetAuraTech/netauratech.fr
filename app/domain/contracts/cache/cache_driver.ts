/**
 * Contract that any cache driver must implement.
 *
 * Switching the underlying store (Redis, Memcached, in-memory, …) only
 * requires providing a new class that satisfies this interface and passing
 * it to `CacheService`. No other application code needs to change.
 */
export interface CacheDriver {
  /**
   * Returns the cached value for `key`, or `null` if missing / expired.
   * The value is JSON-decoded automatically.
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Stores `value` under `key`. Value is JSON-encoded automatically.
   *
   * @param key   - Cache key
   * @param value - Any JSON-serialisable value
   * @param ttl   - Time-to-live in seconds. Omit for no expiry.
   */
  set<T>(key: string, value: T, ttl?: number): Promise<void>

  /**
   * Deletes a single key. No-op if the key does not exist.
   */
  delete(key: string): Promise<void>

  /**
   * Deletes all keys matching a glob pattern.
   * Useful for invalidating a namespace (e.g. `builder:session:42:*`).
   *
   * @param pattern - Glob pattern, e.g. `prefix:*`
   */
  deletePattern(pattern: string): Promise<void>

  /**
   * Returns the cached value for `key` if it exists, otherwise calls
   * `factory`, caches the result with the given `ttl`, and returns it.
   *
   * Equivalent to "get-or-set" / "cache-aside" pattern.
   *
   * @param key     - Cache key
   * @param factory - Async function that produces the value on cache miss
   * @param ttl     - Time-to-live in seconds
   */
  remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>

  /**
   * Returns whether a key currently exists in the cache.
   */
  has(key: string): Promise<boolean>

  /**
   * Atomically increments a numeric counter stored at `key` by `by`.
   * Creates the key with value `by` if it does not exist.
   * Returns the new value.
   */
  increment(key: string, by?: number): Promise<number>

  /**
   * Removes all keys in the cache. Use with care in production.
   */
  flush(): Promise<void>

  /**
   * Returns all keys matching a glob pattern.
   * Uses SCAN internally — safe for production.
   *
   * @param pattern - Glob pattern, e.g. `builder:lock:42:*`
   */
  keys(pattern: string): Promise<string[]>
}
