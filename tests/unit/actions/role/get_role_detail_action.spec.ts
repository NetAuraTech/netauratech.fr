import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import Role from '#models/auth/role'
import User from '#models/auth/user'
import Permission from '#models/auth/permission'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

test.group('GetRoleDetailAction', () => {
  test('execute() returns the role with permissions and users preloaded', async ({ assert }) => {
    const action = await app.container.make(GetRoleDetailAction)

    const role = await Role.create({ name: 'Spec Role Detail', slug: 'spec_role_detail' })
    const perm = await Permission.create({
      slug: 'spec_role_detail_perm',
      name: 'Spec Role Detail Perm',
      category: 'spec',
    })
    await role.related('permissions').attach([perm.id])
    await User.create({
      email: 'spec_role_detail@test.com',
      username: 'spec_role_detail',
      password: 'pwd',
      roleId: role.id,
    })

    const found = await action.execute({ id: role.id })

    assert.equal(found.id, role.id)
    assert.lengthOf(found.permissions, 1)
    assert.equal(found.permissions[0].slug, 'spec_role_detail_perm')
    assert.lengthOf(found.users, 1)
  })

  test('execute() throws RowNotFoundException when role does not exist', async ({ assert }) => {
    const action = await app.container.make(GetRoleDetailAction)

    await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException)
  })
})
