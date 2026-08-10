import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetUserDetailAction } from '#actions/user/get_user_detail_action'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

test.group('GetUserDetailAction', () => {
  test('execute() throws RowNotFoundException if user does not exist', async ({ assert }) => {
    const action = await app.container.make(GetUserDetailAction)

    await assert.rejects(async () => {
      await action.execute({ id: 999999 })
    }, RowNotFoundException)
  })

  test('execute() returns user with role and permissions loaded', async ({ assert }) => {
    const action = await app.container.make(GetUserDetailAction)
    const role = await Role.create({ slug: 'detail_role_user', name: 'Detail Role' })
    const user = await User.create({
      email: 'detail@test.com',
      username: 'detail',
      password: 'pwd',
      roleId: role.id,
    })

    const result = await action.execute({ id: user.id })
    assert.equal(result.id, user.id)
    assert.isNotNull(result.role)
    assert.equal(result.role.slug, 'detail_role_user')
  })
})
