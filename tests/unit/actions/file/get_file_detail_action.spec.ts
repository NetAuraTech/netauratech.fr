import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetFileDetailAction } from '#actions/file/get_file_detail_action'
import CmsFile from '#models/file/file'

test.group('GetFileDetailAction', () => {
  test('execute() returns the file with alts preloaded', async ({ assert }) => {
    const action = await app.container.make(GetFileDetailAction)

    const file = await CmsFile.create({
      filename: 'detail_file.jpg',
      originalName: 'photo_detail.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 2048,
      path: 'cms/files/detail_file.jpg',
      disk: 'fs',
    })

    const result = await action.execute({ id: file.id })
    assert.equal(result.id, file.id)
    assert.equal(result.originalName, 'photo_detail.jpg')
  })

  test('execute() throws when file not found', async ({ assert }) => {
    const action = await app.container.make(GetFileDetailAction)

    await assert.rejects(async () => {
      await action.execute({ id: 999999 })
    })
  })
})
