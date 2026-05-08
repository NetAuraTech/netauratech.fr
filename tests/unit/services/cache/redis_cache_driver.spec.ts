import { test } from '@japa/runner'
import { RedisCacheDriver } from '#services/cache/drivers/redis_cache_driver'
import redis from '@adonisjs/redis/services/main'

test.group('RedisCacheDriver', (group) => {
  let driver: RedisCacheDriver

  group.each.setup(async () => {
    driver = new RedisCacheDriver()
    await driver.flush()
  })

  group.each.teardown(async () => {
    await driver.flush()
  })

  test('set() and get() store and retrieve JSON serializable data', async ({ assert }) => {
    const payload = { foo: 'bar', age: 42 }
    await driver.set('test:key', payload)

    const retrieved = await driver.get<{ foo: string; age: number }>('test:key')
    assert.deepEqual(retrieved, payload)
  })

  test('get() returns null for non-existent key', async ({ assert }) => {
    assert.isNull(await driver.get('test:missing'))
  })

  test('get() returns null when JSON parsing fails', async ({ assert }) => {
    // Manually set invalid JSON directly via Redis
    await redis.connection().set('test:invalid', 'not-valid-json{')

    const retrieved = await driver.get('test:invalid')
    assert.isNull(retrieved)
  })

  test('set() with TTL expires the key', async ({ assert }) => {
    await driver.set('test:ttl', 'value', 1) // 1 second TTL
    assert.isTrue(await driver.has('test:ttl'))

    // Wait for 1.1 seconds
    await new Promise((resolve) => setTimeout(resolve, 1100))

    assert.isFalse(await driver.has('test:ttl'))
  }).timeout(3000)

  test('delete() removes a specific key', async ({ assert }) => {
    await driver.set('test:del', 'value')
    await driver.delete('test:del')
    assert.isFalse(await driver.has('test:del'))
  })

  test('has() checks for existence', async ({ assert }) => {
    assert.isFalse(await driver.has('test:exists'))
    await driver.set('test:exists', 'val')
    assert.isTrue(await driver.has('test:exists'))
  })

  test('increment() increments a counter', async ({ assert }) => {
    // Should start at 1 if not exists
    let val = await driver.increment('test:counter')
    assert.equal(val, 1)

    // Default increment is 1
    val = await driver.increment('test:counter')
    assert.equal(val, 2)

    // Custom increment
    val = await driver.increment('test:counter', 5)
    assert.equal(val, 7)
  })

  test('remember() returns cached value on hit', async ({ assert }) => {
    await driver.set('test:remember', 'cached-value')

    let factoryCalled = false
    const val = await driver.remember('test:remember', async () => {
      factoryCalled = true
      return 'factory-value'
    })

    assert.equal(val, 'cached-value')
    assert.isFalse(factoryCalled)
  })

  test('remember() calls factory and caches result on miss', async ({ assert }) => {
    let factoryCalled = false
    const val = await driver.remember(
      'test:remember:miss',
      async () => {
        factoryCalled = true
        return 'factory-value'
      },
      10
    )

    assert.equal(val, 'factory-value')
    assert.isTrue(factoryCalled)

    // Verify it was cached
    const cached = await driver.get('test:remember:miss')
    assert.equal(cached, 'factory-value')
  })

  test('keys() returns matching keys via SCAN', async ({ assert }) => {
    await driver.set('test:scan:1', 'a')
    await driver.set('test:scan:2', 'b')
    await driver.set('other:scan:3', 'c')

    const keys = await driver.keys('test:scan:*')
    assert.lengthOf(keys, 2)
    assert.includeMembers(keys, ['test:scan:1', 'test:scan:2'])
  })

  test('deletePattern() removes matching keys via SCAN', async ({ assert }) => {
    await driver.set('test:delpat:1', 'a')
    await driver.set('test:delpat:2', 'b')
    await driver.set('other:delpat:3', 'c')

    await driver.deletePattern('test:delpat:*')

    assert.isFalse(await driver.has('test:delpat:1'))
    assert.isFalse(await driver.has('test:delpat:2'))
    assert.isTrue(await driver.has('other:delpat:3'))
  })

  test('flush() deletes everything in the database', async ({ assert }) => {
    await driver.set('test:flush:1', 'a')
    await driver.flush()
    assert.isFalse(await driver.has('test:flush:1'))
  })
})
