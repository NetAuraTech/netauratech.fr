import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetFolderDetailAction } from '#actions/file_folder/get_folder_detail_action'
import FileFolder from '#models/file/file_folder'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

test.group('GetFolderDetailAction', () => {
  test('execute() returns an existing folder', async ({ assert }) => {
    const action = await app.container.make(GetFolderDetailAction)

    const folder = await FileFolder.create({ name: 'detail_test' })

    const found = await action.execute({ id: folder.id })
    assert.equal(found.id, folder.id)
  })

  test('execute() throws RowNotFoundException for an unknown id', async ({ assert }) => {
    const action = await app.container.make(GetFolderDetailAction)

    await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException)
  })
})
