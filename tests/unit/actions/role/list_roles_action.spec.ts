import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListRolesAction } from '#actions/role/list_roles_action'
import Role from '#models/auth/role'
import User from '#models/auth/user'
import Permission from '#models/auth/permission'

test.group('ListRolesAction', () => {
  test('execute() returns paginated roles with preloaded permissions and user count', async ({
    assert,
  }) => {
    const action = await app.container.make(ListRolesAction)

    const role1 = await Role.create({
      slug: 'search_role_list_1',
      name: 'Unique Role List One',
      description: 'desc1',
    })
    await Role.create({
      slug: 'search_role_list_2',
      name: 'Another Role List',
      description: 'Unique Desc Role List Two',
    })

    const perm = await Permission.create({
      slug: 'role_list_perm_2',
      name: 'Role List Perm 2',
      category: 'test',
    })
    await role1.related('permissions').attach([perm.id])

    await User.create({
      email: 'u_rolelist1@test.com',
      username: 'u_rolelist1',
      password: 'pwd',
      roleId: role1.id,
    })
    await User.create({
      email: 'u_rolelist2@test.com',
      username: 'u_rolelist2',
      password: 'pwd',
      roleId: role1.id,
    })

    let result = await action.execute({ pagination: { page: 1, perPage: 10 } })
    assert.isAbove(result.total, 1)

    const fullRole1 = result.all().find((r) => r.slug === 'search_role_list_1')
    assert.isDefined(fullRole1)
    assert.isDefined(fullRole1!.permissions)
    assert.lengthOf(fullRole1!.permissions, 1)
    assert.equal(fullRole1!.$extras.users_count, 2)

    result = await action.execute({
      search: 'Unique Role List',
      pagination: { page: 1, perPage: 10 },
    })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].slug, 'search_role_list_1')
  })
})
