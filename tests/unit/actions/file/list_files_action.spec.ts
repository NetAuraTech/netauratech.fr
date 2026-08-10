import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListFilesAction } from '#actions/file/list_files_action'
import CmsFile from '#models/file/file'

test.group('ListFilesAction', () => {
  test('execute() returns paginated files with filters', async ({ assert }) => {
    const action = await app.container.make(ListFilesAction)

    await CmsFile.create({
      filename: 'file1_list.jpg',
      originalName: 'photo1.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1024,
      path: 'cms/files/file1_list.jpg',
      disk: 'fs',
    })

    const result = await action.execute({ pagination: { page: 1, perPage: 20 } })
    assert.isAbove(result.total, 0)

    const mimeTypeResult = await action.execute({
      mimeType: 'image/jpeg',
      pagination: { page: 1, perPage: 20 },
    })
    assert.isAbove(mimeTypeResult.total, 0)
  })
})
