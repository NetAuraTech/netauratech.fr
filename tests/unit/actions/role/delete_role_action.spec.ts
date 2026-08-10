import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { DeleteRoleAction } from '#actions/role/delete_role_action'
import Role from '#models/auth/role'
import User from '#models/auth/user'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import SystemRoleImmutableException from '#exceptions/auth/system_role_immutable_exception'

test.group('DeleteRoleAction', () => {
  test('execute() deletes a custom role and reassigns its users to the default role', async ({
    assert,
  }) => {
    const action = await app.container.make(DeleteRoleAction)

    const fallback = await Role.updateOrCreate(
      { slug: 'user' },
      {
        name: 'roles.user.value',
        slug: 'user',
        description: 'roles.user.description',
        isSystem: true,
      }
    )
    const role = await Role.create({ name: 'Spec Delete Role', slug: 'spec_delete_role' })
    const user1 = await User.create({
      email: 'spec_delete_role_1@test.com',
      username: 'spec_delete_role_1',
      password: 'pwd',
      roleId: role.id,
    })
    const user2 = await User.create({
      email: 'spec_delete_role_2@test.com',
      username: 'spec_delete_role_2',
      password: 'pwd',
      roleId: role.id,
    })

    const result = await action.execute({ id: role.id })

    assert.isTrue(result)
    assert.isNull(await Role.find(role.id))

    await user1.refresh()
    await user2.refresh()
    assert.equal(user1.roleId, fallback.id)
    assert.equal(user2.roleId, fallback.id)
  })

  test('execute() throws RowNotFoundException when role does not exist', async ({ assert }) => {
    const action = await app.container.make(DeleteRoleAction)

    await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException)
  })

  test('execute() throws SystemRoleImmutableException on system role', async ({ assert }) => {
    const action = await app.container.make(DeleteRoleAction)
    const role = await Role.create({
      name: 'Spec Delete System Role',
      slug: 'spec_delete_system_role',
      isSystem: true,
    })

    await assert.rejects(() => action.execute({ id: role.id }), SystemRoleImmutableException)
  })
})
