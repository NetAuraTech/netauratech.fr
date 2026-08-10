import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { RenameFolderAction } from '#actions/file_folder/rename_folder_action'
import FileFolder from '#models/file/file_folder'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

test.group('RenameFolderAction', () => {
  test('execute() updates the folder name', async ({ assert }) => {
    const action = await app.container.make(RenameFolderAction)

    const folder = await FileFolder.create({ name: 'old_name_rename_test' })

    const updated = await action.execute({ id: folder.id, name: 'new_name_rename_test' })

    assert.equal(updated.name, 'new_name_rename_test')
  })

  test('execute() throws RowNotFoundException when folder does not exist', async ({ assert }) => {
    const action = await app.container.make(RenameFolderAction)

    await assert.rejects(async () => {
      await action.execute({ id: 999999, name: 'new_name' })
    }, RowNotFoundException)
  })
})
