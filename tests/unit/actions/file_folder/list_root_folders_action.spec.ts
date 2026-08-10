import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListRootFoldersAction } from '#actions/file_folder/list_root_folders_action'
import FileFolder from '#models/file/file_folder'

test.group('ListRootFoldersAction', () => {
  test('execute() returns root folders sorted alphabetically', async ({ assert }) => {
    const action = await app.container.make(ListRootFoldersAction)

    await FileFolder.create({ name: 'z_last_root' })
    await FileFolder.create({ name: 'a_first_root' })

    const folders = await action.execute()

    const aIndex = folders.findIndex((f) => f.name === 'a_first_root')
    const zIndex = folders.findIndex((f) => f.name === 'z_last_root')
    assert.isBelow(aIndex, zIndex)
  })
})
