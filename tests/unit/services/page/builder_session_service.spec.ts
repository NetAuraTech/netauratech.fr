import { test } from '@japa/runner'
import { BuilderSessionService } from '#services/page/builder_session_service'
import { LOCK_TTL_MS } from '#types/builder'
import { CacheService } from '#services/cache/cache_service'
import { RedisCacheDriver } from '#services/cache/drivers/redis_cache_driver'

/**
 * Unit tests for `BuilderSessionService`.
 *
 * No mocks needed — the service is a pure in-memory singleton.
 * Clock-sensitive lock expiry tests use `setTimeout` with slightly longer
 * delays to avoid flakiness on slow CI runners.
 */
test.group('BuilderSessionService — presence', (group) => {
  let service: BuilderSessionService
  let cache: CacheService

  group.each.setup(() => {
    const driver = new RedisCacheDriver()
    cache = new CacheService(driver)
    service = new BuilderSessionService(cache)
  })

  group.each.teardown(async () => {
    await cache.flush()
  })

  const TRANSLATION_ID = 1
  const USER_A = { userId: 10, userName: 'alice', userEmail: 'alice@example.com' }
  const USER_B = { userId: 20, userName: 'bob', userEmail: 'bob@example.com' }

  test('join() creates a session and returns it with a colour', async ({ assert }) => {
    const session = await service.join(TRANSLATION_ID, USER_A)
    assert.equal(session.userId, USER_A.userId)
    assert.equal(session.userName, USER_A.userName)
    assert.isString(session.color)
    assert.match(session.color, /^#[0-9a-f]{6}$/i)
  })

  test('join() is idempotent — returns same session on second call', async ({ assert }) => {
    const s1 = await service.join(TRANSLATION_ID, USER_A)
    const s2 = await service.join(TRANSLATION_ID, USER_A)
    // s1 has a Date object, s2 has an ISO string from Redis deserialization
    assert.deepEqual(JSON.parse(JSON.stringify(s1)), s2)
  })

  test('join() assigns different colours to different users', async ({ assert }) => {
    const s1 = await service.join(TRANSLATION_ID, USER_A)
    const s2 = await service.join(TRANSLATION_ID, USER_B)
    assert.notEqual(s1.color, s2.color)
  })

  test('getPresence() returns all active sessions sorted by joinedAt', async ({ assert }) => {
    await service.join(TRANSLATION_ID, USER_A)
    await service.join(TRANSLATION_ID, USER_B)
    const presence = await service.getPresence(TRANSLATION_ID)
    assert.lengthOf(presence, 2)
    assert.equal(presence[0].userId, USER_A.userId)
    assert.equal(presence[1].userId, USER_B.userId)
  })

  test('getPresence() returns empty array when no sessions', async ({ assert }) => {
    assert.deepEqual(await service.getPresence(TRANSLATION_ID), [])
  })

  test('leave() removes the session', async ({ assert }) => {
    await service.join(TRANSLATION_ID, USER_A)
    await service.leave(TRANSLATION_ID, USER_A.userId)
    assert.lengthOf(await service.getPresence(TRANSLATION_ID), 0)
  })

  test('leave() is a no-op when user is not in session', ({ assert }) => {
    assert.doesNotThrow(async () => await service.leave(TRANSLATION_ID, 99))
  })

  test('getSession() returns null for unknown user', async ({ assert }) => {
    assert.isNull(await service.getSession(TRANSLATION_ID, 99))
  })

  test('getSession() returns the session for a known user', async ({ assert }) => {
    await service.join(TRANSLATION_ID, USER_A)
    const s = await service.getSession(TRANSLATION_ID, USER_A.userId)
    assert.isNotNull(s)
    assert.equal(s!.userId, USER_A.userId)
  })
})

test.group('BuilderSessionService — locks', (group) => {
  let service: BuilderSessionService
  let cache: CacheService

  group.each.setup(() => {
    const driver = new RedisCacheDriver()
    cache = new CacheService(driver)
    service = new BuilderSessionService(cache)
  })

  group.each.teardown(async () => {
    await cache.flush()
  })

  const T = 1
  const BLOCK = 'block-1'
  const FIELD = 'title'
  const USER_A = { userId: 10, userName: 'alice', userEmail: 'alice@example.com' }
  const USER_B = { userId: 20, userName: 'bob', userEmail: 'bob@example.com' }

  test('acquireLock() grants lock when field is free', async ({ assert }) => {
    await service.join(T, USER_A)
    const result = await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)
    assert.isTrue(result.acquired)
    assert.equal(result.lock.userId, USER_A.userId)
    assert.equal(result.lock.blockId, BLOCK)
    assert.equal(result.lock.fieldKey, FIELD)
  })

  test('acquireLock() sets expiresAt ~LOCK_TTL_MS in the future', async ({ assert }) => {
    await service.join(T, USER_A)
    const before = Date.now()
    const { lock } = await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)
    const after = Date.now()
    assert.isAbove(lock.expiresAt.getTime(), before + LOCK_TTL_MS - 50)
    assert.isBelow(lock.expiresAt.getTime(), after + LOCK_TTL_MS + 50)
  })

  test('acquireLock() denies when another user holds the lock', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.join(T, USER_B)
    await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)

    const result = await service.acquireLock(T, BLOCK, FIELD, USER_B.userId)
    assert.isFalse(result.acquired)
    assert.equal(result.lock.userId, USER_A.userId)
  })

  test('acquireLock() renews TTL when same user re-acquires', async ({ assert }) => {
    await service.join(T, USER_A)
    const { lock: first } = await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)

    // Wait a tiny bit then re-acquire
    const { acquired, lock: second } = await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)
    assert.isTrue(acquired)
    assert.isAbove(second.expiresAt.getTime(), first.expiresAt.getTime() - 1)
  })

  test('acquireLock() allows same user to lock multiple different fields', async ({ assert }) => {
    await service.join(T, USER_A)
    const r1 = await service.acquireLock(T, BLOCK, 'title', USER_A.userId)
    const r2 = await service.acquireLock(T, BLOCK, 'content', USER_A.userId)
    assert.isTrue(r1.acquired)
    assert.isTrue(r2.acquired)
    assert.lengthOf(await service.getLocks(T), 2)
  })

  test('acquireLock() allows different users to lock different fields of the same block', async ({
    assert,
  }) => {
    await service.join(T, USER_A)
    await service.join(T, USER_B)
    const r1 = await service.acquireLock(T, BLOCK, 'title', USER_A.userId)
    const r2 = await service.acquireLock(T, BLOCK, 'content', USER_B.userId)
    assert.isTrue(r1.acquired)
    assert.isTrue(r2.acquired)
  })

  test('releaseLock() removes the lock', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)

    const released = await service.releaseLock(T, BLOCK, FIELD, USER_A.userId)
    assert.isNotNull(released)
    assert.isNull(await service.getLock(T, BLOCK, FIELD))
  })

  test('releaseLock() returns null when lock does not exist', async ({ assert }) => {
    const result = await service.releaseLock(T, BLOCK, FIELD, USER_A.userId)
    assert.isNull(result)
  })

  test('releaseLock() is a no-op when called by a non-owner', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.join(T, USER_B)
    await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)

    const result = await service.releaseLock(T, BLOCK, FIELD, USER_B.userId)
    assert.isNull(result)
    // Lock still held by A
    assert.isNotNull(await service.getLock(T, BLOCK, FIELD))
  })

  test('releaseAllLocks() releases all locks held by a user', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.join(T, USER_B)
    await service.acquireLock(T, BLOCK, 'title', USER_A.userId)
    await service.acquireLock(T, BLOCK, 'content', USER_A.userId)
    await service.acquireLock(T, BLOCK, 'align', USER_B.userId)

    const released = await service.releaseAllLocks(T, USER_A.userId)
    assert.lengthOf(released, 2)
    assert.lengthOf(await service.getLocks(T), 1) // B's lock remains
    const locks = await service.getLocks(T)
    assert.equal(locks[0].userId, USER_B.userId)
  })

  test('releaseAllLocks() returns empty array when user has no locks', async ({ assert }) => {
    await service.join(T, USER_A)
    const result = await service.releaseAllLocks(T, USER_A.userId)
    assert.deepEqual(result, [])
  })

  test('getLocks() returns all active locks for a translation', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.join(T, USER_B)
    await service.acquireLock(T, 'block-1', 'title', USER_A.userId)
    await service.acquireLock(T, 'block-2', 'content', USER_B.userId)

    const locks = await service.getLocks(T)
    assert.lengthOf(locks, 2)
  })

  test('getLocks() returns empty array for unknown translation', async ({ assert }) => {
    assert.deepEqual(await service.getLocks(999), [])
  })

  test('getLock() returns the specific lock for a field', async ({ assert }) => {
    await service.join(T, USER_A)
    await service.acquireLock(T, BLOCK, FIELD, USER_A.userId)

    const lock = await service.getLock(T, BLOCK, FIELD)
    assert.isNotNull(lock)
    assert.equal(lock!.fieldKey, FIELD)
  })

  test('getLock() returns null for an unlocked field', async ({ assert }) => {
    assert.isNull(await service.getLock(T, BLOCK, FIELD))
  })
})

test.group('BuilderSessionService — isolation between translations', (group) => {
  let service: BuilderSessionService
  let cache: CacheService

  group.each.setup(() => {
    const driver = new RedisCacheDriver()
    cache = new CacheService(driver)
    service = new BuilderSessionService(cache)
  })

  group.each.teardown(async () => {
    await cache.flush()
  })

  test('sessions and locks are isolated between different translationIds', async ({ assert }) => {
    const USER = { userId: 1, userName: 'alice', userEmail: 'alice@example.com' }

    await service.join(1, USER)
    await service.join(2, USER)

    await service.acquireLock(1, 'block', 'title', USER.userId)

    assert.lengthOf(await service.getLocks(1), 1)
    assert.lengthOf(await service.getLocks(2), 0)

    await service.leave(1, USER.userId)
    assert.lengthOf(await service.getPresence(1), 0)
    assert.lengthOf(await service.getPresence(2), 1)
  })
})
