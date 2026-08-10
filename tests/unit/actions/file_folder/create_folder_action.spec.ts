import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { CreateFolderAction } from '#actions/file_folder/create_folder_action'
import FileFolder from '#models/file/file_folder'

test.group('CreateFolderAction', () => {
  test('execute() creates a folder without parent', async ({ assert }) => {
    const action = await app.container.make(CreateFolderAction)

    const folder = await action.execute({ name: 'new_root_folder_test' })

    assert.isNotNull(folder.id)
    assert.equal(folder.name, 'new_root_folder_test')
    assert.isNull(folder.parentId)
  })

  test('execute() creates a nested folder with parent', async ({ assert }) => {
    const action = await app.container.make(CreateFolderAction)

    const parent = await FileFolder.create({ name: 'parent_nested_test' })

    const folder = await action.execute({ name: 'nested_folder_test', parentId: parent.id })

    assert.isNotNull(folder.id)
    assert.equal(folder.parentId, parent.id)
  })
})
