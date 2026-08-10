import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListFolderChildrenAction } from '#actions/file_folder/list_folder_children_action'
import FileFolder from '#models/file/file_folder'

test.group('ListFolderChildrenAction', () => {
  test('execute() returns children of the given parent folder', async ({ assert }) => {
    const action = await app.container.make(ListFolderChildrenAction)

    const parent = await FileFolder.create({ name: 'parent_children_test' })
    await FileFolder.create({ name: 'child1_children', parentId: parent.id })
    await FileFolder.create({ name: 'child2_children', parentId: parent.id })

    const children = await action.execute({ parentId: parent.id })
    assert.lengthOf(children, 2)
  })

  test('execute() returns empty array when no children exist', async ({ assert }) => {
    const action = await app.container.make(ListFolderChildrenAction)

    const parent = await FileFolder.create({ name: 'empty_parent_test' })
    const children = await action.execute({ parentId: parent.id })
    assert.lengthOf(children, 0)
  })
})
