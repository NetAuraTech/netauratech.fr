import { test } from '@japa/runner'
import { RoleService } from '#services/auth/role_service'
import app from '@adonisjs/core/services/app'
import Role from '#models/auth/role'
import User from '#models/auth/user'
import Permission from '#models/auth/permission'

test.group('RoleService', () => {
  test('findAll() returns all roles sorted by name', async ({ assert }) => {
    const service = await app.container.make(RoleService)

    // Create uniquely named roles
    await Role.create({ slug: 'z_role', name: 'Z Role' })
    await Role.create({ slug: 'a_role', name: 'A Role' })

    const roles = await service.findAll()

    assert.isAbove(roles.length, 1)

    // A Role should be somewhere before Z Role if sorted by name
    const aIndex = roles.findIndex((p) => p.slug === 'a_role')
    const zIndex = roles.findIndex((p) => p.slug === 'z_role')
    assert.isBelow(aIndex, zIndex)
  })

  test('list() returns paginated roles with preloaded permissions and user count', async ({
    assert,
  }) => {
    const service = await app.container.make(RoleService)

    const role1 = await Role.create({
      slug: 'search_role_1',
      name: 'Unique Role One',
      description: 'desc1',
    })
    await Role.create({
      slug: 'search_role_2',
      name: 'Another Role',
      description: 'Unique Desc Role Two',
    })

    const perm = await Permission.create({
      slug: 'role_list_perm',
      name: 'Role List Perm',
      category: 'test',
    })
    await role1.related('permissions').attach([perm.id])

    await User.create({
      email: 'u_role1@example.com',
      username: 'u_role1',
      password: 'pwd',
      roleId: role1.id,
    })
    await User.create({
      email: 'u_role2@example.com',
      username: 'u_role2',
      password: 'pwd',
      roleId: role1.id,
    })

    // Test without filter
    let result = await service.list({}, { page: 1, perPage: 10 })
    assert.isAbove(result.total, 1)

    // Find our specific role to verify eager loads
    const fullRole1 = result.all().find((r) => r.slug === 'search_role_1')
    assert.isDefined(fullRole1)
    assert.isDefined(fullRole1!.permissions)
    assert.lengthOf(fullRole1!.permissions, 1)
    assert.equal(fullRole1!.$extras.users_count, 2)

    // Test search by name
    result = await service.list({ search: 'Unique Role' }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].slug, 'search_role_1')

    // Test search by description
    result = await service.list({ search: 'Unique Desc Role' }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].slug, 'search_role_2')
  })
})
