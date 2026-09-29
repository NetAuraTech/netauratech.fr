import redis from '@adonisjs/redis/services/main';
import { type CacheDriver } from '#core/contracts/cache_driver';

/**
 * Lua: replace KEYS[1] with ARGV[2] (and refresh its TTL) only if the stored
 * value still equals ARGV[1]. Runs as a single atomic script — no
 * check-then-act window between processes.
 */
const CAS_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  redis.call('SET', KEYS[1], ARGV[2])
  if tonumber(ARGV[3]) > 0 then
    redis.call('EXPIRE', KEYS[1], ARGV[3])
  end
  return 1
end
return 0
`;

/**
 * Lua: delete KEYS[1] only if the stored value still equals ARGV[1].
 */
const CAD_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

/**
 * Redis-backed cache driver using `@adonisjs/redis`.
 *
 * Uses the default Redis connection configured in `config/redis.ts`.
 * To use a named connection, pass it to the constructor:
 *
 * @example
 * new RedisCacheDriver('cache') // uses the "cache" connection
 */
export class RedisCacheDriver implements CacheDriver {
	private readonly client;

	constructor(connection?: string) {
		this.client = connection ? redis.connection(connection as any) : redis.connection();
	}

	async get<T>(key: string): Promise<T | null> {
		const raw = await this.client.get(key);
		if (raw === null) return null;
		try {
			return JSON.parse(raw) as T;
		} catch {
			return null;
		}
	}

	async set<T>(key: string, value: T, ttl?: number): Promise<void> {
		const serialised = JSON.stringify(value);
		if (ttl !== undefined && ttl > 0) {
			await this.client.set(key, serialised, 'EX', ttl);
		} else {
			await this.client.set(key, serialised);
		}
	}

	async delete(key: string): Promise<void> {
		await this.client.del(key);
	}

	async deletePattern(pattern: string): Promise<void> {
		// SCAN is safe for production — avoids blocking KEYS
		let cursor = '0';
		do {
			const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;
			if (keys.length > 0) {
				await this.client.del(...keys);
			}
		} while (cursor !== '0');
	}

	async remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = await this.get<T>(key);
		if (cached !== null) return cached;

		const value = await factory();
		await this.set(key, value, ttl);
		return value;
	}

	async has(key: string): Promise<boolean> {
		const exists = await this.client.exists(key);
		return exists === 1;
	}

	async increment(key: string, by: number = 1): Promise<number> {
		if (by === 1) return this.client.incr(key);
		return this.client.incrby(key, by);
	}

	async flush(): Promise<void> {
		await this.client.flushdb();
	}

	async keys(pattern: string): Promise<string[]> {
		const results: string[] = [];
		let cursor = '0';
		do {
			const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
			cursor = nextCursor;
			results.push(...keys);
		} while (cursor !== '0');
		return results;
	}

	/**
	 * Returns the decoded values of all live keys matching a glob pattern, as
	 * a map of key → value. Runs one SCAN pass followed by chunked MGET so a
	 * large namespace never produces one oversized command.
	 */
	async list<T>(pattern: string): Promise<Record<string, T>> {
		const keys = await this.keys(pattern);
		const values: Record<string, T> = {};

		// MGET in chunks so a large namespace never produces one oversized command
		const CHUNK_SIZE = 500;
		for (let i = 0; i < keys.length; i += CHUNK_SIZE) {
			const chunk = keys.slice(i, i + CHUNK_SIZE);
			const rawValues = await this.client.mget(...chunk);
			chunk.forEach((key, index) => {
				const raw = rawValues[index];
				if (raw === null) return;
				try {
					values[key] = JSON.parse(raw) as T;
				} catch {
					// Skip keys written by external clients holding non-JSON payloads
				}
			});
		}

		return values;
	}

	/**
	 * Atomically stores `value` under `key` only if no live value is present
	 * (`SET ... NX`). The check and the write happen in a single Redis
	 * command, so concurrent claims across processes yield exactly one winner.
	 */
	async setIfAbsent<T>(key: string, value: T, ttl?: number): Promise<boolean> {
		const serialised = JSON.stringify(value);
		const result =
			ttl !== undefined && ttl > 0
				? await this.client.set(key, serialised, 'EX', ttl, 'NX')
				: await this.client.set(key, serialised, 'NX');
		return result === 'OK';
	}

	/**
	 * Atomically replaces the value at `key` with `value` (and refreshes its
	 * TTL) only if the stored value still equals `expected`. Runs as a single
	 * Lua script, so the compare and the set are atomic across processes.
	 */
	async compareAndSet<T>(key: string, expected: T, value: T, ttl?: number): Promise<boolean> {
		const result = await this.client.eval(
			CAS_SCRIPT,
			1,
			key,
			JSON.stringify(expected),
			JSON.stringify(value),
			String(ttl ?? 0),
		);
		return result === 1;
	}

	/**
	 * Atomically deletes `key` only if the stored value still equals
	 * `expected`. Runs as a single Lua script.
	 */
	async compareAndDelete<T>(key: string, expected: T): Promise<boolean> {
		const result = await this.client.eval(CAD_SCRIPT, 1, key, JSON.stringify(expected));
		return result === 1;
	}
}
