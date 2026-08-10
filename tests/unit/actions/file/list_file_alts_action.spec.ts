import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ListFileAltsAction } from '#actions/file/list_file_alts_action'
import CmsFile from '#models/file/file'
import FileAlt from '#models/file/file_alt'

test.group('ListFileAltsAction', () => {
  test('execute() returns alts for existing file', async ({ assert }) => {
    const action = await app.container.make(ListFileAltsAction)

    const file = await CmsFile.create({
      filename: 'listalt_file.jpg',
      originalName: 'photo_listalt.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1024,
      path: 'cms/files/listalt_file.jpg',
      disk: 'fs',
    })

    await FileAlt.create({ fileId: file.id, locale: 'en', key: 'hero', value: 'English alt' })
    await FileAlt.create({ fileId: file.id, locale: 'fr', key: 'hero', value: 'French alt' })

    const alts = await action.execute({ fileId: file.id })
    assert.lengthOf(alts, 2)
  })

  test('execute() throws when file does not exist', async ({ assert }) => {
    const action = await app.container.make(ListFileAltsAction)

    await assert.rejects(async () => {
      await action.execute({ fileId: 999999 })
    })
  })
})
