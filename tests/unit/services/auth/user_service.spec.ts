import { test } from '@japa/runner'
import { UserService } from '#services/auth/user_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'

test.group('UserService', () => {
  test('list() returns paginated users with optional filters', async ({ assert }) => {
    const service = await app.container.make(UserService)
    const role1 = await Role.create({ slug: 'role1', name: 'Role 1' })
    const role2 = await Role.create({ slug: 'role2', name: 'Role 2' })

    await User.create({
      email: 'u1@example.com',
      username: 'u1',
      password: 'pwd',
      roleId: role1.id,
    })
    await User.create({
      email: 'u2@example.com',
      username: 'u2',
      password: 'pwd',
      roleId: role2.id,
    })

    // Filter by role
    let result = await service.list({ role: String(role1.id) }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].username, 'u1')

    // Filter by search
    result = await service.list({ search: 'u2' }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].email, 'u2@example.com')
  })

  test('detail() throws RowNotFoundException if user does not exist', async ({ assert }) => {
    const service = await app.container.make(UserService)

    await assert.rejects(async () => {
      await service.detail(999999)
    }, RowNotFoundException)
  })

  test('detail() returns user with role and permissions loaded', async ({ assert }) => {
    const service = await app.container.make(UserService)
    const role = await Role.create({ slug: 'detail_role', name: 'Detail Role' })
    const user = await User.create({
      email: 'detail@example.com',
      username: 'detail',
      password: 'pwd',
      roleId: role.id,
    })

    const result = await service.detail(user.id)
    assert.equal(result.id, user.id)
    assert.isNotNull(result.role)
    assert.equal(result.role.slug, 'detail_role')
    assert.isDefined(result.role.permissions) // It's an array
  })

  test('update() dispatches InitiateEmailChange if email changes', async ({ assert }) => {
    const service = await app.container.make(UserService)
    const fakeEmitter = emitter.fake()

    const user = await User.create({
      email: 'update1@example.com',
      username: 'update1',
      password: 'pwd',
    })

    const result = await service.update(user.id, {
      email: 'new_update1@example.com',
      username: 'new_update1',
    })

    assert.isNotNull(result)
    // The email should NOT change immediately
    assert.equal(result!.email, 'update1@example.com')
    // But pendingEmail should be set
    assert.equal(result!.pendingEmail, 'new_update1@example.com')
    // And username should change immediately
    assert.equal(result!.username, 'new_update1')

    assert.isTrue(fakeEmitter.exists(events.account.InitiateEmailChange))

    emitter.restore()
  })

  test('update() does not dispatch email change event if email is identical', async ({
    assert,
  }) => {
    const service = await app.container.make(UserService)
    const fakeEmitter = emitter.fake()

    const user = await User.create({
      email: 'update2@example.com',
      username: 'update2',
      password: 'pwd',
    })

    await service.update(user.id, { email: 'update2@example.com', username: 'new_update2' })

    assert.isFalse(fakeEmitter.exists(events.account.InitiateEmailChange))

    emitter.restore()
  })

  test('delete() removes the user', async ({ assert }) => {
    const service = await app.container.make(UserService)
    const user = await User.create({
      email: 'delete@example.com',
      username: 'delete',
      password: 'pwd',
    })

    await service.delete(user.id)

    const found = await User.find(user.id)
    assert.isNull(found)
  })
})
