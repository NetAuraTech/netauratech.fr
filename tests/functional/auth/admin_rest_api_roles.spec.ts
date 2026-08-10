import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import redis from '@adonisjs/redis/services/main'
import testUtils from '@adonisjs/core/services/test_utils'
import limiter from '@adonisjs/limiter/services/main'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import Permission from '#models/auth/permission'
import { MaintenanceService } from '#services/maintenance/maintenance_service'
import { createAdminUser } from '#tests/helpers/browser/create_admin_user'

async function resetSharedState() {
  await redis.flushdb()
  const service = await app.container.make(MaintenanceService)
  await service.setConfig({ enabled: false })
}

/**
 * Admin REST API v1 — Roles & Permissions resource.
 */
test.group('Admin REST API v1 — Roles', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.setup(resetSharedState)
  group.each.setup(() => limiter.clear())
  group.each.teardown(() => limiter.clear())

  // ── List ──

  test('lists roles as a paginated payload', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-list@example.com',
      permissionSlugs: ['roles.view'],
    })
    const token = await User.accessTokens.create(admin)

    await Role.create({ name: 'Editor', slug: 'editor' })
    await Role.create({ name: 'Moderator', slug: 'moderator' })

    const res = await client
      .get('/api/v1/admin/roles?page=1&perPage=2')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    const body = res.body()
    assert.isArray(body.data)
    assert.isAtMost(body.data.length, 2)
    assert.exists(body.metadata)
    assert.exists(body.metadata.total)
    assert.equal(body.metadata.perPage, 2)
    assert.equal(body.metadata.currentPage, 1)
  })

  test('list filters roles by search term', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-search@example.com',
      permissionSlugs: ['roles.view'],
    })
    const token = await User.accessTokens.create(admin)

    await Role.create({ name: 'SearchableRole', slug: 'searchable' })
    await Role.create({ name: 'OtherRole', slug: 'other' })

    const res = await client
      .get('/api/v1/admin/roles?search=SearchableRole')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    const names = res.body().data.map((r: { name: string }) => r.name)
    assert.include(names, 'SearchableRole')
    assert.notInclude(names, 'OtherRole')
  })

  // ── Show ──

  test('shows a role by id', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-show@example.com',
      permissionSlugs: ['roles.view'],
    })
    const token = await User.accessTokens.create(admin)

    const role = await Role.create({ name: 'Viewer', slug: 'viewer' })

    const res = await client
      .get(`/api/v1/admin/roles/${role.id}`)
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    assert.equal(res.body().data.slug, 'viewer')
    assert.equal(res.body().data.name, 'Viewer')
  })

  test('show returns 404 on unknown id', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-show-404@example.com',
      permissionSlugs: ['roles.view'],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .get('/api/v1/admin/roles/99999')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(404)
  })

  // ── Create ──

  test('creates a role', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-create@example.com',
      permissionSlugs: ['roles.create'],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .post('/api/v1/admin/roles')
      .accept('json')
      .bearerToken(token.value!.release())
      .json({
        name: 'Guest',
        slug: 'guest',
        description: 'Read-only access',
      })

    res.assertStatus(201)
    assert.equal(res.body().data.slug, 'guest')
    assert.equal(res.body().data.name, 'Guest')
  })

  test('create returns 422 on duplicate slug', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-create-dup@example.com',
      permissionSlugs: ['roles.create'],
    })
    const token = await User.accessTokens.create(admin)

    await Role.create({ name: 'Existing', slug: 'existing' })

    const res = await client
      .post('/api/v1/admin/roles')
      .accept('json')
      .bearerToken(token.value!.release())
      .json({ name: 'Duplicate', slug: 'existing' })

    res.assertStatus(422)
  })

  test('create returns 422 on an invalid payload', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-create-422@example.com',
      permissionSlugs: ['roles.create'],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .post('/api/v1/admin/roles')
      .accept('json')
      .bearerToken(token.value!.release())
      .json({ name: '' })

    res.assertStatus(422)
  })

  // ── Update ──

  test('updates a role', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-update@example.com',
      permissionSlugs: ['roles.update'],
    })
    const token = await User.accessTokens.create(admin)

    const role = await Role.create({ name: 'OldName', slug: 'old' })

    const res = await client
      .put(`/api/v1/admin/roles/${role.id}`)
      .accept('json')
      .bearerToken(token.value!.release())
      .json({ name: 'NewName', slug: 'new-slug' })

    res.assertStatus(200)
    assert.equal(res.body().data.name, 'NewName')
    assert.equal(res.body().data.slug, 'new-slug')
  })

  test('update returns 404 on unknown id', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-update-404@example.com',
      permissionSlugs: ['roles.update'],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .put('/api/v1/admin/roles/99999')
      .accept('json')
      .bearerToken(token.value!.release())
      .json({ name: 'Nope', slug: 'nope' })

    res.assertStatus(404)
  })

  // ── Delete ──

  test('deletes a role', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-delete@example.com',
      permissionSlugs: ['roles.delete'],
    })
    const token = await User.accessTokens.create(admin)

    await Role.create({ name: 'User', slug: 'user', isSystem: true })
    const role = await Role.create({ name: 'Deletable', slug: 'deletable' })

    const res = await client
      .delete(`/api/v1/admin/roles/${role.id}`)
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(204)
  })

  test('delete returns 404 on unknown id', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-delete-404@example.com',
      permissionSlugs: ['roles.delete'],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .delete('/api/v1/admin/roles/99999')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(404)
  })

  // ── 401 / 403 ──

  test('roles endpoints return 401 without a token', async ({ client }) => {
    const res = await client.get('/api/v1/admin/roles').accept('json')
    res.assertStatus(401)
  })

  test('roles endpoints return 403 without the required permission', async ({ client }) => {
    const admin = await createAdminUser({
      email: 'admin-roles-403@example.com',
      permissionSlugs: [],
    })
    const token = await User.accessTokens.create(admin)

    const res = await client
      .get('/api/v1/admin/roles')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(403)
  })

  // ── Permissions ──

  test('lists all permissions', async ({ client, assert }) => {
    const admin = await createAdminUser({
      email: 'admin-perms-list@example.com',
      permissionSlugs: ['roles.view'],
    })
    const token = await User.accessTokens.create(admin)

    await Permission.create({ name: 'View files', slug: 'files.view', category: 'files' })
    await Permission.create({ name: 'Create files', slug: 'files.create', category: 'files' })

    const res = await client
      .get('/api/v1/admin/permissions')
      .accept('json')
      .bearerToken(token.value!.release())

    res.assertStatus(200)
    assert.isArray(res.body().data)
    const slugs = res.body().data.map((p: { slug: string }) => p.slug)
    assert.includeMembers(slugs, ['files.view', 'files.create'])
  })
})
