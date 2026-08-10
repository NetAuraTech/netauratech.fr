import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { CreatePermissionAction } from '#actions/permission/create_permission_action'
import Permission from '#models/auth/permission'
import SlugExistsException from '#exceptions/core/slug_exists_exception'

test.group('CreatePermissionAction', () => {
  test('execute() creates a custom permission', async ({ assert }) => {
    const action = await app.container.make(CreatePermissionAction)

    const permission = await action.execute({
      name: 'Spec Create Permission',
      slug: 'spec_create_permission',
      category: 'spec',
      description: 'Created by spec',
    })

    assert.isNotNull(permission.id)
    assert.isFalse(permission.isSystem)
    assert.equal(permission.category, 'spec')
  })

  test('execute() throws SlugExistsException when slug is already taken', async ({ assert }) => {
    const action = await app.container.make(CreatePermissionAction)
    await Permission.create({
      name: 'Spec Create Permission Dup',
      slug: 'spec_create_permission_dup',
      category: 'spec',
    })

    await assert.rejects(
      () =>
        action.execute({
          name: 'Other',
          slug: 'spec_create_permission_dup',
          category: 'spec',
          description: null,
        }),
      SlugExistsException
    )
  })
})
