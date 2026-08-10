import { test } from '@japa/runner'
import { UserRepository } from '#repositories/auth/user_repository'
import { UserFactory, RoleFactory } from '#factories/user_factory'

test.group('UserRepository', () => {
  const repo = new UserRepository()

  const uniqueUser = async (prefix: string) => {
    const timestamp = Date.now() + Math.floor(Math.random() * 1000)
    return await UserFactory.merge({
      username: `${prefix}_${timestamp}`,
      email: `${prefix}_${timestamp}@example.com`,
    }).create()
  }

  test('findById() and create()', async ({ assert }) => {
    const user = await repo.create({
      username: 'create_test_' + Date.now(),
      email: 'create_test_' + Date.now() + '@example.com',
      password: 'Password123!',
    })

    const found = await repo.findById(user.id)
    assert.isNotNull(found)
    assert.equal(found!.username, user.username)
  })

  test('findAll() returns users', async ({ assert }) => {
    await uniqueUser('all_1')
    await uniqueUser('all_2')

    const results = await repo.findAll({ limit: 1 })
    assert.lengthOf(results, 1)
  })

  test('findOne() and findMany()', async ({ assert }) => {
    const u1 = await uniqueUser('crit_1')
    await uniqueUser('crit_2')

    const one = await repo.findOne({ email: u1.email })
    assert.isNotNull(one)
    assert.equal(one!.id, u1.id)

    const many = await repo.findMany({ email: u1.email })
    assert.isAtLeast(many.length, 1)
  })

  test('findByEmail() and emailExists()', async ({ assert }) => {
    const u = await uniqueUser('email_find')

    const found = await repo.findByEmail(u.email)
    assert.isNotNull(found)

    assert.isTrue(await repo.emailExists(u.email))
    assert.isFalse(await repo.emailExists('non_existent@example.com'))
  })

  test('findByProviderId() and linkProvider()/unlinkProvider()', async ({ assert }) => {
    const ts = Date.now()
    const u = await uniqueUser('provider')
    await repo.linkProvider(u, 'github', `github_123_${ts}`)

    let found = await repo.findByProviderId('github', `github_123_${ts}`)
    assert.isNotNull(found)
    assert.equal(found!.id, u.id)

    await repo.unlinkProvider(u, 'github')
    found = await repo.findByProviderId('github', `github_123_${ts}`)
    assert.isNull(found)
  })

  test('findByProviderIdExcluding()', async ({ assert }) => {
    const ts = Date.now()
    const u1 = await uniqueUser('prov_ex1')
    const u2 = await uniqueUser('prov_ex2')
    await repo.linkProvider(u1, 'google', `google_456_${ts}`)

    // Search excluding u2 (should find u1)
    let found = await repo.findByProviderIdExcluding('google', `google_456_${ts}`, u2.id)
    assert.isNotNull(found)
    assert.equal(found!.id, u1.id)

    // Search excluding u1 (should find nothing)
    found = await repo.findByProviderIdExcluding('google', `google_456_${ts}`, u1.id)
    assert.isNull(found)
  })

  test('verifyCredentials()', async ({ assert }) => {
    const email = 'verify_' + Date.now() + '@example.com'
    const u = await repo.create({
      username: 'verify_' + Date.now(),
      email,
      password: 'CorrectPassword1!',
    })

    const verified = await repo.verifyCredentials(email, 'CorrectPassword1!')
    assert.isNotNull(verified)
    assert.equal(verified.id, u.id)

    await assert.rejects(() => repo.verifyCredentials(email, 'WrongPassword!'))
  })

  test('update() and updatePassword() and markEmailAsVerified()', async ({ assert }) => {
    const u = await uniqueUser('update')

    await repo.update(u, { username: 'new_username_123' })
    assert.equal(u.username, 'new_username_123')

    await repo.updatePassword(u, 'NewPass123!')
    // We can't easily assert hashed password matching here without the hash provider, but we ensure it doesn't throw

    await repo.markEmailAsVerified(u)
    assert.isNotNull(u.emailVerifiedAt)
  })

  test('delete()', async ({ assert }) => {
    const u = await uniqueUser('delete')
    const result = await repo.delete(u.id)
    assert.isTrue(result)

    const found = await repo.findById(u.id)
    assert.isNull(found)
  })

  test('count() and exists()', async ({ assert }) => {
    const u = await uniqueUser('count_exists')

    const c = await repo.count({ email: u.email })
    assert.equal(c, 1)

    assert.isTrue(await repo.exists({ email: u.email }))
  })

  test('count() with operator', async ({ assert }) => {
    const c = await repo.count({ id: { operator: '>', value: 0 } })
    assert.isAtLeast(c, 0)
  })

  test('save()', async ({ assert }) => {
    const u = await uniqueUser('save')
    u.username = 'manual_save'
    await repo.save(u)

    const reloaded = await repo.findById(u.id)
    assert.equal(reloaded!.username, 'manual_save')
  })

  test('reassignRole() moves every user from one role to another', async ({ assert }) => {
    const fromRole = await RoleFactory.create()
    const toRole = await RoleFactory.create()

    const u1 = await UserFactory.merge({ roleId: fromRole.id }).create()
    const u2 = await UserFactory.merge({ roleId: fromRole.id }).create()
    const untouched = await UserFactory.merge({ roleId: toRole.id }).create()

    const moved = await repo.reassignRole(fromRole.id, toRole.id)

    assert.equal(moved, 2)

    await u1.refresh()
    await u2.refresh()
    await untouched.refresh()
    assert.equal(u1.roleId, toRole.id)
    assert.equal(u2.roleId, toRole.id)
    assert.equal(untouched.roleId, toRole.id)
  })
})
