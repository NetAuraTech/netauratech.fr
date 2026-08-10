import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { UpsertFileAltAction } from '#actions/file/upsert_file_alt_action'
import CmsFile from '#models/file/file'

test.group('UpsertFileAltAction', () => {
  test('execute() upserts alt text for existing file', async ({ assert }) => {
    const action = await app.container.make(UpsertFileAltAction)

    const file = await CmsFile.create({
      filename: 'alt_file.jpg',
      originalName: 'photo_alt.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1024,
      path: 'cms/files/alt_file.jpg',
      disk: 'fs',
    })

    await action.execute({ fileId: file.id, locale: 'en', key: 'hero', value: 'Alt text here' })

    const alts = await file.related('alts').query()
    assert.lengthOf(alts, 1)
    assert.equal(alts[0].value, 'Alt text here')
  })

  test('execute() throws when file does not exist', async ({ assert }) => {
    const action = await app.container.make(UpsertFileAltAction)

    await assert.rejects(async () => {
      await action.execute({ fileId: 999999, locale: 'en', key: 'hero', value: 'alt' })
    })
  })
})
