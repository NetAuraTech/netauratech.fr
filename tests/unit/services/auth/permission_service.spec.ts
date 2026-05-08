import { test } from '@japa/runner'
import { PermissionService } from '#services/auth/permission_service'
import app from '@adonisjs/core/services/app'
import Permission from '#models/auth/permission'

test.group('PermissionService', () => {
  test('findAll() returns all permissions sorted by name', async ({ assert }) => {
    const service = await app.container.make(PermissionService)

    // Create uniquely named permissions
    await Permission.create({
      slug: 'z_perm',
      name: 'Z Permission',
      category: 'test_findAll',
    })
    await Permission.create({
      slug: 'a_perm',
      name: 'A Permission',
      category: 'test_findAll',
    })

    const permissions = await service.findAll()

    assert.isAbove(permissions.length, 1)

    // A Permission should be somewhere before Z Permission if sorted by name
    const aIndex = permissions.findIndex((p) => p.slug === 'a_perm')
    const zIndex = permissions.findIndex((p) => p.slug === 'z_perm')
    assert.isBelow(aIndex, zIndex)
  })

  test('list() returns paginated permissions with optional search filter', async ({ assert }) => {
    const service = await app.container.make(PermissionService)

    await Permission.create({
      slug: 'search_1',
      name: 'Unique Name One',
      description: 'desc1',
      category: 'test_list',
    })
    await Permission.create({
      slug: 'search_2',
      name: 'Another Permission',
      description: 'Unique Desc Two',
      category: 'test_list',
    })

    // Test without filter
    let result = await service.list({}, { page: 1, perPage: 10 })
    assert.isAbove(result.total, 1)

    // Test search by name
    result = await service.list({ search: 'Unique Name' }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].slug, 'search_1')

    // Test search by description
    result = await service.list({ search: 'Unique Desc' }, { page: 1, perPage: 10 })
    assert.equal(result.total, 1)
    assert.equal(result.all()[0].slug, 'search_2')
  })
})
