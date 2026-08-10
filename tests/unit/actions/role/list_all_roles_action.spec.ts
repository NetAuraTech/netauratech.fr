import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import Role from '#models/auth/role'

test.group('ListAllRolesAction', () => {
  test('execute() returns all roles sorted by name', async ({ assert }) => {
    const action = await app.container.make(ListAllRolesAction)

    await Role.create({ slug: 'z_role_all', name: 'Z Role All' })
    await Role.create({ slug: 'a_role_all', name: 'A Role All' })

    const roles = await action.execute()

    assert.isAbove(roles.length, 1)
    const aIndex = roles.findIndex((r) => r.slug === 'a_role_all')
    const zIndex = roles.findIndex((r) => r.slug === 'z_role_all')
    assert.isBelow(aIndex, zIndex)
  })
})
