import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { UpdateRoleAction } from '#actions/role/update_role_action'
import Role from '#models/auth/role'
import Permission from '#models/auth/permission'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import SlugExistsException from '#exceptions/core/slug_exists_exception'
import SystemRoleImmutableException from '#exceptions/auth/system_role_immutable_exception'

test.group('UpdateRoleAction', () => {
  test('execute() updates attributes and syncs permissions', async ({ assert }) => {
    const action = await app.container.make(UpdateRoleAction)

    const role = await Role.create({ name: 'Spec Update Role', slug: 'spec_update_role' })
    const perm1 = await Permission.create({
      slug: 'spec_update_role_perm_1',
      name: 'Spec Update Role Perm 1',
      category: 'spec',
    })
    const perm2 = await Permission.create({
      slug: 'spec_update_role_perm_2',
      name: 'Spec Update Role Perm 2',
      category: 'spec',
    })
    const perm3 = await Permission.create({
      slug: 'spec_update_role_perm_3',
      name: 'Spec Update Role Perm 3',
      category: 'spec',
    })
    await role.syncPermissions([perm1.id, perm2.id])

    const updated = await action.execute({
      id: role.id,
      name: 'Spec Update Role Renamed',
      slug: 'spec_update_role',
      description: 'Updated by spec',
      permissionIds: [perm2.id, perm3.id],
    })

    assert.equal(updated.name, 'Spec Update Role Renamed')
    assert.equal(updated.description, 'Updated by spec')
    assert.deepEqual(updated.permissions.map((p) => p.id).sort(), [perm2.id, perm3.id].sort())
  })

  test('execute() throws RowNotFoundException when role does not exist', async ({ assert }) => {
    const action = await app.container.make(UpdateRoleAction)

    await assert.rejects(
      () =>
        action.execute({
          id: 999999,
          name: 'X',
          slug: 'spec_update_role_missing',
          description: null,
        }),
      RowNotFoundException
    )
  })

  test('execute() throws SystemRoleImmutableException on system role', async ({ assert }) => {
    const action = await app.container.make(UpdateRoleAction)
    const role = await Role.create({
      name: 'Spec Update System Role',
      slug: 'spec_update_system_role',
      isSystem: true,
    })

    await assert.rejects(
      () =>
        action.execute({
          id: role.id,
          name: 'Renamed',
          slug: 'spec_update_system_role',
          description: null,
        }),
      SystemRoleImmutableException
    )
  })

  test('execute() throws SlugExistsException when new slug is already taken', async ({
    assert,
  }) => {
    const action = await app.container.make(UpdateRoleAction)
    await Role.create({ name: 'Spec Update Taken A', slug: 'spec_update_taken_a' })
    const role = await Role.create({ name: 'Spec Update Taken B', slug: 'spec_update_taken_b' })

    await assert.rejects(
      () =>
        action.execute({
          id: role.id,
          name: 'Renamed',
          slug: 'spec_update_taken_a',
          description: null,
        }),
      SlugExistsException
    )
  })
})
