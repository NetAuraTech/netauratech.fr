import { test } from '@japa/runner'
import Role from '#models/auth/role'
import Permission from '#models/auth/permission'

test.group('Role Model', () => {
  test('isAdmin returns true only if slug is admin', ({ assert }) => {
    const role1 = new Role()
    role1.slug = 'admin'
    assert.isTrue(role1.isAdmin)

    const role2 = new Role()
    role2.slug = 'editor'
    assert.isFalse(role2.isAdmin)
  })

  test('canBeDeleted and canBeModified return false for system roles', ({ assert }) => {
    const role = new Role()
    role.isSystem = true

    assert.isFalse(role.canBeDeleted)
    assert.isFalse(role.canBeModified)

    role.isSystem = false
    assert.isTrue(role.canBeDeleted)
    assert.isTrue(role.canBeModified)
  })

  test('hasPermission returns true if role has the requested permission', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role', name: 'Test Role' })
    const perm1 = await Permission.create({
      slug: 'read_stuff',
      name: 'Read Stuff',
      category: 'test',
    })
    await Permission.create({
      slug: 'write_stuff',
      name: 'Write Stuff',
      category: 'test',
    })

    await role.related('permissions').attach([perm1.id])

    assert.isTrue(await role.hasPermission('read_stuff'))
    assert.isFalse(await role.hasPermission('write_stuff'))
  })

  test('assignPermission attaches a permission to the role', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role_2', name: 'Test Role 2' })
    const perm = await Permission.create({ slug: 'do_stuff', name: 'Do Stuff', category: 'test' })

    await role.assignPermission(perm.id)

    assert.isTrue(await role.hasPermission('do_stuff'))
  })

  test('removePermission detaches a permission from the role', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role_3', name: 'Test Role 3' })
    const perm = await Permission.create({
      slug: 'do_stuff_3',
      name: 'Do Stuff 3',
      category: 'test',
    })

    await role.assignPermission(perm.id)
    assert.isTrue(await role.hasPermission('do_stuff_3'))

    await role.removePermission(perm.id)
    await role.load('permissions') // reload relation since hasPermission might use cached if we didn't force load it
    assert.isFalse(await role.hasPermission('do_stuff_3'))
  })

  test('syncPermissions replaces existing permissions with new ones', async ({ assert }) => {
    const role = await Role.create({ slug: 'test_role_4', name: 'Test Role 4' })
    const perm1 = await Permission.create({ slug: 'perm1', name: 'Perm 1', category: 'test' })
    const perm2 = await Permission.create({ slug: 'perm2', name: 'Perm 2', category: 'test' })
    const perm3 = await Permission.create({ slug: 'perm3', name: 'Perm 3', category: 'test' })

    await role.assignPermission(perm1.id)
    await role.assignPermission(perm2.id)

    // Sync to only have perm3
    await role.syncPermissions([perm3.id])

    await role.load('permissions')
    assert.lengthOf(role.permissions, 1)
    assert.isTrue(await role.hasPermission('perm3'))
    assert.isFalse(await role.hasPermission('perm1'))
    assert.isFalse(await role.hasPermission('perm2'))
  })
})
