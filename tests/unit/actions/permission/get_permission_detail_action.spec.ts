import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetPermissionDetailAction } from '#actions/permission/get_permission_detail_action'
import Permission from '#models/auth/permission'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

test.group('GetPermissionDetailAction', () => {
  test('execute() returns the permission', async ({ assert }) => {
    const action = await app.container.make(GetPermissionDetailAction)
    const permission = await Permission.create({
      name: 'Spec Permission Detail',
      slug: 'spec_permission_detail',
      category: 'spec',
    })

    const found = await action.execute({ id: permission.id })

    assert.equal(found.id, permission.id)
    assert.equal(found.slug, 'spec_permission_detail')
  })

  test('execute() throws RowNotFoundException when permission does not exist', async ({
    assert,
  }) => {
    const action = await app.container.make(GetPermissionDetailAction)

    await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException)
  })
})
