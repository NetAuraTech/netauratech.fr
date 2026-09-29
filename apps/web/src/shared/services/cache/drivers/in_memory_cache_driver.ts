import { type CacheDriver } from '#core/contracts/cache_driver';

interface Entry {
	value: string;
	expiresAt: number | null;
}

/**
 * In-memory cache driver backed by a `Map`.
 *
 * Single-process implementation of the {@link CacheDriver} contract with the
 * same semantics as the Redis driver: values are JSON-encoded on the wire,
 * TTLs expire lazily on access, and pattern operations use the same glob
 * dialect (`*`, `?`, `[...]`) as Redis `SCAN MATCH`.
 *
 * Intended for tests and single-process environments — every process sees
 * its own store. The production {@link CacheService} binding stays on Redis
 * (see `start/container.ts`); this driver is exposed as a container
 * singleton so it can be injected or swapped in wherever the contract is
 * needed.
 *
 * @example
 * const driver = await app.container.make(InMemoryCacheDriver)
 * const cache = new CacheService(driver).namespace('builder')
 */
export class InMemoryCacheDriver implements CacheDriver {
	private readonly entries = new Map<string, Entry>();

	/**
	 * Returns the cached value for `key`, or `null` if missing / expired.
	 */
	async get<T>(key: string): Promise<T | null> {
		const entry = this.alive(key);
		if (!entry) return null;
		try {
			return JSON.parse(entry.value) as T;
		} catch {
			return null;
		}
	}

	/**
	 * Stores `value` under `key` with an optional TTL in seconds.
	 */
	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		this.entries.set(key, {
			value: JSON.stringify(value),
			expiresAt: ttl !== undefined && ttl > 0 ? Date.now() + ttl * 1000 : null,
		});
	}

	/**
	 * Deletes a single key. No-op if the key does not exist.
	 */
	async delete(key: string): Promise<void> {
		this.entries.delete(key);
	}

	/**
	 * Deletes all keys matching a glob pattern.
	 */
	async deletePattern(pattern: string): Promise<void> {
		const matcher = globToRegExp(pattern);
		for (const key of this.aliveKeys()) {
			if (matcher.test(key)) {
				this.entries.delete(key);
			}
		}
	}

	/**
	 * Returns the cached value on hit, otherwise calls `factory`, caches the
	 * result, and returns it.
	 */
	async remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = await this.get<T>(key);
		if (cached !== null) return cached;

		const value = await factory();
		await this.set(key, value, ttl);
		return value;
	}

	/**
	 * Returns whether a key currently exists in the cache.
	 */
	async has(key: string): Promise<boolean> {
		return this.alive(key) !== undefined;
	}

	/**
	 * Atomically increments a numeric counter stored at `key` by `by`.
	 * Creates the key with value `by` if it does not exist.
	 *
	 * @throws {Error} When the key holds a non-numeric value (the Redis
	 *   driver surfaces this as a `WRONGTYPE` error).
	 */
	async increment(key: string, by: number = 1): Promise<number> {
		const entry = this.alive(key);
		const current = entry ? Number(entry.value) : 0;
		if (!Number.isFinite(current)) {
			throw new Error(`InMemoryCacheDriver: value at "${key}" is not a number`);
		}

		const next = current + by;
		// Keep the existing TTL, like Redis INCR/INCRBY does.
		this.entries.set(key, { value: String(next), expiresAt: entry?.expiresAt ?? null });
		return next;
	}

	/**
	 * Removes all keys in the cache.
	 */
	async flush(): Promise<void> {
		this.entries.clear();
	}

	/**
	 * Returns all keys matching a glob pattern, sorted for determinism.
	 */
	async keys(pattern: string): Promise<string[]> {
		const matcher = globToRegExp(pattern);
		return this.aliveKeys()
			.filter((key) => matcher.test(key))
			.sort();
	}

	/**
	 * Returns the decoded values of all live keys matching a glob pattern,
	 * as a map of key → value, sorted for determinism.
	 */
	async list<T>(pattern: string): Promise<Record<string, T>> {
		const matcher = globToRegExp(pattern);
		const values: Record<string, T> = {};

		for (const key of this.aliveKeys().sort()) {
			if (!matcher.test(key)) continue;
			const raw = this.entries.get(key)?.value;
			if (raw === undefined) continue;
			try {
				values[key] = JSON.parse(raw) as T;
			} catch {
				// Skip keys written by external clients holding non-JSON payloads
			}
		}

		return values;
	}

	/**
	 * Stores `value` under `key` only if no live value is present.
	 *
	 * The check and the write happen in a single synchronous block, which is
	 * atomic within a process — the single-process equivalent of Redis
	 * `SET ... NX`.
	 */
	async setIfAbsent<T>(key: string, value: T, ttl?: number): Promise<boolean> {
		if (this.alive(key)) return false;
		await this.set(key, value, ttl);
		return true;
	}

	/**
	 * Replaces the value at `key` with `value` (and refreshes its TTL) only if
	 * the stored value still equals `expected`.
	 */
	async compareAndSet<T>(key: string, expected: T, value: T, ttl?: number): Promise<boolean> {
		const entry = this.alive(key);
		if (!entry || entry.value !== JSON.stringify(expected)) return false;
		await this.set(key, value, ttl);
		return true;
	}

	/**
	 * Deletes `key` only if the stored value still equals `expected`.
	 */
	async compareAndDelete<T>(key: string, expected: T): Promise<boolean> {
		const entry = this.alive(key);
		if (!entry || entry.value !== JSON.stringify(expected)) return false;
		this.entries.delete(key);
		return true;
	}

	/**
	 * Returns the entry for `key` if present and not expired, evicting the
	 * entry when its TTL has passed.
	 */
	private alive(key: string): Entry | undefined {
		const entry = this.entries.get(key);
		if (!entry) return undefined;
		if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
			this.entries.delete(key);
			return undefined;
		}
		return entry;
	}

	/**
	 * Returns the keys of every live entry, evicting expired ones along the way.
	 */
	private aliveKeys(): string[] {
		const now = Date.now();
		for (const [key, entry] of this.entries) {
			if (entry.expiresAt !== null && entry.expiresAt <= now) {
				this.entries.delete(key);
			}
		}
		return [...this.entries.keys()];
	}
}

/**
 * Compiles a Redis-style glob pattern into an anchored regular expression.
 * Supports `*` (any run of characters), `?` (single character) and `[...]`
 * character classes; every other character is matched literally.
 *
 * @param pattern - Glob pattern, e.g. `builder:lock:42:*`
 * @returns Anchored regular expression matching the same keys as `SCAN MATCH`.
 */
function globToRegExp(pattern: string): RegExp {
	let source = '^';
	let i = 0;
	while (i < pattern.length) {
		const char = pattern[i];
		if (char === '*') {
			source += '.*';
		} else if (char === '?') {
			source += '.';
		} else if (char === '[') {
			const end = pattern.indexOf(']', i + 1);
			if (end === -1) {
				source += '\\[';
			} else {
				source += pattern.slice(i, end + 1);
				i = end;
			}
		} else {
			source += char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		}
		i++;
	}
	return new RegExp(`${source}$`);
}
