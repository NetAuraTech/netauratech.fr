import redis from '@adonisjs/redis/services/main'
import { type CacheDriver } from '#contracts/cache/cache_driver'

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
  private readonly client

  constructor(connection?: string) {
    this.client = connection ? redis.connection(connection as any) : redis.connection()
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key)
    if (raw === null) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serialised = JSON.stringify(value)
    if (ttl !== undefined && ttl > 0) {
      await this.client.set(key, serialised, 'EX', ttl)
    } else {
      await this.client.set(key, serialised)
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    // SCAN is safe for production — avoids blocking KEYS
    let cursor = '0'
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } while (cursor !== '0')
  }

  async remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  async has(key: string): Promise<boolean> {
    const exists = await this.client.exists(key)
    return exists === 1
  }

  async increment(key: string, by: number = 1): Promise<number> {
    if (by === 1) return this.client.incr(key)
    return this.client.incrby(key, by)
  }

  async flush(): Promise<void> {
    await this.client.flushdb()
  }

  async keys(pattern: string): Promise<string[]> {
    const results: string[] = []
    let cursor = '0'
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = nextCursor
      results.push(...keys)
    } while (cursor !== '0')
    return results
  }
}
