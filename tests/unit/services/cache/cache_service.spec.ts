import { test } from '@japa/runner'
import { CacheService } from '#services/cache/cache_service'
import type { CacheDriver } from '#contracts/cache/cache_driver'

class FakeCacheDriver implements CacheDriver {
  public calls: { method: string; args: any[] }[] = []

  async get<T>(key: string): Promise<T | null> {
    this.calls.push({ method: 'get', args: [key] })
    return null
  }
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.calls.push({ method: 'set', args: [key, value, ttl] })
  }
  async delete(key: string): Promise<void> {
    this.calls.push({ method: 'delete', args: [key] })
  }
  async deletePattern(pattern: string): Promise<void> {
    this.calls.push({ method: 'deletePattern', args: [pattern] })
  }
  async remember<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    this.calls.push({ method: 'remember', args: [key, ttl] })
    return factory()
  }
  async has(key: string): Promise<boolean> {
    this.calls.push({ method: 'has', args: [key] })
    return false
  }
  async increment(key: string, by?: number): Promise<number> {
    this.calls.push({ method: 'increment', args: [key, by] })
    return 1
  }
  async flush(): Promise<void> {
    this.calls.push({ method: 'flush', args: [] })
  }
  async keys(pattern: string): Promise<string[]> {
    this.calls.push({ method: 'keys', args: [pattern] })
    return []
  }
}

test.group('CacheService', (group) => {
  let driver: FakeCacheDriver
  let cache: CacheService

  group.each.setup(() => {
    driver = new FakeCacheDriver()
    cache = new CacheService(driver)
  })

  test('delegates calls without prefix when no namespace is set', async ({ assert }) => {
    await cache.set('foo', 'bar', 10)
    assert.deepEqual(driver.calls[0], { method: 'set', args: ['foo', 'bar', 10] })
  })

  test('namespace() returns a new instance with a prefix', async ({ assert }) => {
    const ns = cache.namespace('builder')
    await ns.set('foo', 'bar')
    assert.deepEqual(driver.calls[0], { method: 'set', args: ['builder:foo', 'bar', undefined] })
  })

  test('namespaces can be nested', async ({ assert }) => {
    const ns = cache.namespace('builder').namespace('lock')
    await ns.delete('foo')
    assert.deepEqual(driver.calls[0], { method: 'delete', args: ['builder:lock:foo'] })
  })

  test('keys() applies prefix to pattern', async ({ assert }) => {
    const ns = cache.namespace('user')
    await ns.keys('*')
    assert.deepEqual(driver.calls[0], { method: 'keys', args: ['user:*'] })
  })

  test('deletePattern() applies prefix to pattern', async ({ assert }) => {
    const ns = cache.namespace('user')
    await ns.deletePattern('session:*')
    assert.deepEqual(driver.calls[0], { method: 'deletePattern', args: ['user:session:*'] })
  })

  test('remember() applies prefix and delegates', async ({ assert }) => {
    const ns = cache.namespace('test')
    let factoryCalled = false
    await ns.remember(
      'key',
      async () => {
        factoryCalled = true
        return 'val'
      },
      60
    )

    assert.deepEqual(driver.calls[0], { method: 'remember', args: ['test:key', 60] })
    assert.isTrue(factoryCalled)
  })

  test('increment() applies prefix', async ({ assert }) => {
    const ns = cache.namespace('test')
    await ns.increment('counter', 5)
    assert.deepEqual(driver.calls[0], { method: 'increment', args: ['test:counter', 5] })
  })

  test('has() applies prefix', async ({ assert }) => {
    const ns = cache.namespace('test')
    await ns.has('key')
    assert.deepEqual(driver.calls[0], { method: 'has', args: ['test:key'] })
  })

  test('flush() does not use prefix, it delegates directly to driver', async ({ assert }) => {
    const ns = cache.namespace('test')
    await ns.flush()
    assert.deepEqual(driver.calls[0], { method: 'flush', args: [] })
  })
})
