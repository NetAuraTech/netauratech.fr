import { test } from '@japa/runner'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import Permission from '#models/auth/permission'
import Token from '#models/core/token'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'

test.group('User Model', () => {
  test('isEmailVerified returns true if emailVerifiedAt is set', ({ assert }) => {
    const user = new User()
    assert.isFalse(user.isEmailVerified)

    user.emailVerifiedAt = DateTime.now()
    assert.isTrue(user.isEmailVerified)
  })

  test('status computed property handles unverified, verified, and pending invite states', async ({
    assert,
  }) => {
    const user = new User()

    // Default
    assert.equal(user.status, 'UNVERIFIED')

    // Verified
    user.emailVerifiedAt = DateTime.now()
    assert.equal(user.status, 'VERIFIED')

    // Pending invite
    user.emailVerifiedAt = null
    user.hasPendingInvite = true
    assert.equal(user.status, TOKEN_TYPES.PENDING_INVITE)
  })

  test('loadPendingInvite sets hasPendingInvite to true if token exists and user is unverified', async ({
    assert,
  }) => {
    const user = await User.create({
      email: 'invite@example.com',
      username: 'invite',
      password: 'pwd',
    })

    // Create a pending invite token
    await Token.create({ userId: user.id, type: TOKEN_TYPES.PENDING_INVITE, token: 'abc' })

    await User.loadPendingInvite(user)
    assert.isTrue(user.hasPendingInvite)

    // Verify user
    user.emailVerifiedAt = DateTime.now()
    await User.loadPendingInvite(user)
    assert.isFalse(
      user.hasPendingInvite,
      'Should be false if user is verified even if token exists'
    )
  })

  test('can() returns true if user role has the permission', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role_can', name: 'Test Role Can' })
    const perm = await Permission.create({
      slug: 'do_action',
      name: 'Do Action Can',
      category: 'test',
    })
    await role.assignPermission(perm.id)

    const user = await User.create({
      email: 'can@example.com',
      username: 'can',
      password: 'pwd',
      roleId: role.id,
    })

    assert.isTrue(await user.can('do_action'))
    assert.isFalse(await user.can('other_action'))
  })

  test('can() returns false if user has no role', async ({ assert }) => {
    const user = await User.create({
      email: 'norole@example.com',
      username: 'norole',
      password: 'pwd',
    })
    assert.isFalse(await user.can('do_action'))
  })

  test('hasAnyRole() returns true if user role is in the list', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role_has', name: 'Test Role Has' })
    const user = await User.create({
      email: 'has@example.com',
      username: 'has',
      password: 'pwd',
      roleId: role.id,
    })

    assert.isTrue(await user.hasAnyRole(['admin', 'test_role_has']))
    assert.isFalse(await user.hasAnyRole(['admin', 'editor']))
  })

  test('hasAnyRole() returns false if user has no role', async ({ assert }) => {
    const user = await User.create({
      email: 'norole2@example.com',
      username: 'norole2',
      password: 'pwd',
    })
    assert.isFalse(await user.hasAnyRole(['admin']))
  })
})
