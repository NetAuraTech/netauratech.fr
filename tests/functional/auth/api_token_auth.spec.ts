import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import redis from '@adonisjs/redis/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'
import User from '#models/auth/user'
import { MaintenanceService } from '#services/maintenance/maintenance_service'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'
import { createAdminUser } from '#tests/helpers/browser/create_admin_user'

/**
 * Maintenance state lives in Redis and persists across runs: an interrupted
 * suite (or a dev session sharing the Redis instance) can leave maintenance
 * ON and 503 every request.
 */
async function resetSharedState() {
  await redis.flushdb()
  const service = await app.container.make(MaintenanceService)
  await service.setConfig({ enabled: false })
}

/**
 * API token authentication — functional coverage of the `api` guard:
 * login issues a token, the token authenticates `/api/v1/*` routes, logout
 * revokes it, expired/invalid tokens get a JSON 401 (never a redirect), and
 * the two guards stay strictly separated (session cookie vs Bearer token).
 *
 * The test environment enables both guards (`.env.test`), which mirrors the
 * `full`/`inertia` flavor with the token guard opted in.
 *
 * Every request sends `Accept: application/json` like a real API client:
 * without it the error handlers take the browser path (redirect back).
 */
test.group('API token authentication', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(resetSharedState)
  group.each.setup(() => limiter.clear())
  group.each.teardown(() => limiter.clear())

  test('login issues an API token for valid credentials', async ({ client, assert }) => {
    const user = await createVerifiedUser({
      email: 'api-login@example.com',
      password: 'TestPassword123!',
    })

    const res = await client.post('/api/v1/auth/login').accept('json').json({
      email: 'api-login@example.com',
      password: 'TestPassword123!',
    })

    res.assertStatus(200)

    const body = res.body()
    assert.isString(body.data.token)
    assert.isNotEmpty(body.data.token)
    assert.isNotNull(body.data.expiresAt)

    // Sanity check: the issued token authenticates the user.
    const me = await client.get('/api/v1/auth/me').accept('json').bearerToken(body.data.token)
    me.assertStatus(200)
    assert.equal(me.body().data.email, user.email)
  })

  test('login rejects invalid credentials with a 401', async ({ client, assert }) => {
    await createVerifiedUser({
      email: 'api-wrong@example.com',
      password: 'TestPassword123!',
    })

    const res = await client.post('/api/v1/auth/login').accept('json').json({
      email: 'api-wrong@example.com',
      password: 'wrong-password',
    })

    res.assertStatus(401)
    assert.equal(res.body().error.code, 'E_INVALID_CREDENTIALS')
  })

  test('login validates the payload', async ({ client }) => {
    const res = await client
      .post('/api/v1/auth/login')
      .accept('json')
      .json({ password: 'TestPassword123!' })

    res.assertStatus(422)
  })

  test('login is rate limited', async ({ client }) => {
    // Budget is 5 attempts per 15 minutes; the 6th must be rejected.
    for (let i = 0; i < 5; i++) {
      const res = await client.post('/api/v1/auth/login').accept('json').json({
        email: 'api-throttle@example.com',
        password: 'wrong-password',
      })
      res.assertStatus(401)
    }

    const res = await client.post('/api/v1/auth/login').accept('json').json({
      email: 'api-throttle@example.com',
      password: 'wrong-password',
    })
    res.assertStatus(429)
  })

  test('me returns the authenticated user', async ({ client, assert }) => {
    const user = await createVerifiedUser({ email: 'api-me@example.com' })
    const token = await User.accessTokens.create(user)

    const res = await client
      .get('/api/v1/auth/me')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    assert.equal(res.body().data.email, user.email)
  })

  test('me rejects a missing token with a 401', async ({ client }) => {
    const res = await client.get('/api/v1/auth/me').accept('json')

    res.assertStatus(401)
  })

  test('me rejects an invalid token with a 401', async ({ client }) => {
    const res = await client.get('/api/v1/auth/me').accept('json').bearerToken('oat_invalid.token')

    res.assertStatus(401)
  })

  test('me rejects an expired token with a 401', async ({ client }) => {
    const user = await createVerifiedUser({ email: 'api-expired@example.com' })
    const token = await User.accessTokens.create(user)
    const value = token.value!.release()

    // Force the token to be expired, whatever the configured lifetime is.
    await db
      .from('auth_access_tokens')
      .where('id', String(token.identifier))
      .update({ expires_at: DateTime.now().minus({ hours: 1 }).toSQL() })

    const res = await client.get('/api/v1/auth/me').accept('json').bearerToken(value)

    res.assertStatus(401)
  })

  test('logout revokes the token used on the request', async ({ client }) => {
    await createVerifiedUser({
      email: 'api-logout@example.com',
      password: 'TestPassword123!',
    })

    const login = await client.post('/api/v1/auth/login').accept('json').json({
      email: 'api-logout@example.com',
      password: 'TestPassword123!',
    })
    login.assertStatus(200)
    const value = login.body().data.token as string

    const logout = await client.post('/api/v1/auth/logout').accept('json').bearerToken(value)
    logout.assertStatus(204)

    // The revoked token must not authenticate anymore.
    const me = await client.get('/api/v1/auth/me').accept('json').bearerToken(value)
    me.assertStatus(401)
  })

  test('logout requires authentication', async ({ client }) => {
    const res = await client.post('/api/v1/auth/logout').accept('json')

    res.assertStatus(401)
  })

  test('a session cookie does not authenticate API routes', async ({ client }) => {
    const user = await createVerifiedUser({ email: 'api-matrix-session@example.com' })

    // loginAs() authenticates through the default (web/session) guard, which
    // only sets a session cookie: the api guard must ignore it.
    const res = await client.get('/api/v1/auth/me').accept('json').loginAs(user)

    res.assertStatus(401)
  })
})

/**
 * Authorization under the `api` guard: the permission middleware resolves
 * the user from whichever guard authenticated the request, so a Bearer token
 * grants exactly the same permissions as a session would.
 */
test.group('API token authorization', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(resetSharedState)
  group.each.setup(() => limiter.clear())
  group.each.teardown(() => limiter.clear())

  test('bearer token with the required permission passes', async ({ client, assert }) => {
    const user = await createAdminUser({
      email: 'api-perm@example.com',
      permissionSlugs: ['files.view'],
    })
    const token = await User.accessTokens.create(user)

    const res = await client
      .get('/api/v1/admin/files')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    assert.exists(res.body().data)
  })

  test('bearer token without the required permission gets a 403', async ({ client }) => {
    const user = await createVerifiedUser({ email: 'api-noperm@example.com' })
    const token = await User.accessTokens.create(user)

    const res = await client
      .get('/api/v1/admin/files')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(403)
  })
})
