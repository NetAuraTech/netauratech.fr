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
	get<T>(key: string): Promise<T | null>;

	/**
	 * Stores `value` under `key`. Value is JSON-encoded automatically.
	 *
	 * @param key   - Cache key
	 * @param value - Any JSON-serialisable value
	 * @param ttl   - Time-to-live in seconds. Omit for no expiry.
	 */
	set<T>(key: string, value: T, ttl?: number): Promise<void>;

	/**
	 * Deletes a single key. No-op if the key does not exist.
	 */
	delete(key: string): Promise<void>;

	/**
	 * Deletes all keys matching a glob pattern.
	 * Useful for invalidating a namespace (e.g. `builder:session:42:*`).
	 *
	 * @param pattern - Glob pattern, e.g. `prefix:*`
	 */
	deletePattern(pattern: string): Promise<void>;

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
	remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T>;

	/**
	 * Returns whether a key currently exists in the cache.
	 */
	has(key: string): Promise<boolean>;

	/**
	 * Atomically increments a numeric counter stored at `key` by `by`.
	 * Creates the key with value `by` if it does not exist.
	 * Returns the new value.
	 */
	increment(key: string, by?: number): Promise<number>;

	/**
	 * Removes all keys in the cache. Use with care in production.
	 */
	flush(): Promise<void>;

	/**
	 * Returns all keys matching a glob pattern.
	 * Uses SCAN internally — safe for production.
	 *
	 * @param pattern - Glob pattern, e.g. `builder:lock:42:*`
	 */
	keys(pattern: string): Promise<string[]>;

	/**
	 * Returns the decoded values of all live keys matching a glob pattern,
	 * as a map of absolute key → value.
	 *
	 * Unlike {@link keys}, values are fetched in the same pass (one SCAN
	 * followed by MGET on Redis) so callers never have to re-read each key.
	 * Keys whose payload is not valid JSON (e.g. keys written by external
	 * clients) are skipped.
	 *
	 * @param pattern - Glob pattern, e.g. `builder:lock:42:*`
	 * @returns Map of absolute key → JSON-decoded value.
	 */
	list<T>(pattern: string): Promise<Record<string, T>>;

	/**
	 * Atomically stores `value` under `key` only if no live value is present
	 * (a set-if-absent / `SET ... NX`).
	 *
	 * @param key   - Cache key
	 * @param value - Any JSON-serialisable value
	 * @param ttl   - Time-to-live in seconds, applied when the key is created.
	 * @returns `true` when the value was stored, `false` when the key already
	 *   existed and was left untouched.
	 */
	setIfAbsent<T>(key: string, value: T, ttl?: number): Promise<boolean>;

	/**
	 * Atomically replaces the value at `key` with `value` (and refreshes its
	 * TTL) only if the stored value still equals `expected` — a
	 * compare-and-set. The comparison is done on the JSON-encoded
	 * representation, so `expected` should be the value obtained from a prior
	 * {@link get} on the same key.
	 *
	 * @param key     - Cache key
	 * @param expected - The value the key must currently hold for the swap to
	 *   proceed
	 * @param value   - The new value to store
	 * @param ttl     - Time-to-live in seconds, applied when the swap happens.
	 * @returns `true` when the swap happened, `false` when the stored value
	 *   had changed (or the key was missing) and was left untouched.
	 */
	compareAndSet<T>(key: string, expected: T, value: T, ttl?: number): Promise<boolean>;

	/**
	 * Atomically deletes `key` only if the stored value still equals
	 * `expected` — a compare-and-delete. The comparison is done on the
	 * JSON-encoded representation, so `expected` should be the value obtained
	 * from a prior {@link get} on the same key.
	 *
	 * @param key      - Cache key
	 * @param expected - The value the key must currently hold for the delete
	 *   to proceed
	 * @returns `true` when the key was deleted, `false` when the stored value
	 *   had changed (or the key was missing) and was left untouched.
	 */
	compareAndDelete<T>(key: string, expected: T): Promise<boolean>;
}
