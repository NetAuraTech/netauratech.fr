import { test } from '@japa/runner'
import sinon from 'sinon'
import app from '@adonisjs/core/services/app'
import { FindFileAction } from '#actions/file/find_file_action'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import { StorageService } from '#services/file/storage_service'
import CmsFile from '#models/file/file'
import FileAlt from '#models/file/file_alt'
import FileNotFoundException from '#exceptions/file/file_not_found_exception'

test.group('FindFileAction', (group) => {
  group.each.setup(async () => {
    sinon.stub(ImageOptimizerService.prototype, 'optimize').resolves({
      width: 800,
      height: 600,
      variants: { 400: 'https://cdn.example.com/hero-400.webp' },
    })
    sinon.stub(StorageService.prototype, 'url').resolves('https://cdn.example.com/hero.jpg')
  })

  group.each.teardown(() => sinon.restore())

  async function createFileWithAlts(alts: { locale: string; key: string; value: string }[]) {
    const file = await CmsFile.create({
      filename: 'hero.jpg',
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 2048,
      path: 'cms/files/hero.jpg',
      disk: 'fs',
    })

    for (const alt of alts) {
      await FileAlt.create({ fileId: file.id, ...alt })
    }

    return file
  }

  test('resolves an existing file with url, variants, alt and type', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([{ locale: 'en', key: 'hero', value: 'Hero alt' }])

    const result = await action.execute({ id: file.id, locale: 'en', altKey: 'hero' })

    assert.equal(result.id, file.id)
    assert.isString(result.url)
    assert.equal(result.alt, 'Hero alt')
    assert.equal(result.type, 'image')
    assert.property(result.variants, '400')
    assert.equal(result.width, 800)
    assert.equal(result.height, 600)
  })

  test('resolves the keyed alt for the requested locale', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([
      { locale: 'en', key: 'hero', value: 'English alt' },
      { locale: 'fr', key: 'hero', value: 'French alt' },
    ])

    const en = await action.execute({ id: file.id, locale: 'en', altKey: 'hero' })
    const fr = await action.execute({ id: file.id, locale: 'fr', altKey: 'hero' })

    assert.equal(en.alt, 'English alt')
    assert.equal(fr.alt, 'French alt')
  })

  test('falls back to the default-locale alt for the key', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([{ locale: 'en', key: 'hero', value: 'English alt' }])

    const result = await action.execute({ id: file.id, locale: 'fr', altKey: 'hero' })

    assert.equal(result.alt, 'English alt')
  })

  test('falls back to the keyed alt in any locale', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([{ locale: 'fr', key: 'hero', value: 'French alt' }])

    const result = await action.execute({ id: file.id, locale: 'en', altKey: 'hero' })

    assert.equal(result.alt, 'French alt')
  })

  test('falls back to the first alt when no key matches', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([
      { locale: 'en', key: 'hero', value: 'First alt' },
      { locale: 'en', key: 'thumbnail', value: 'Thumbnail alt' },
    ])

    const result = await action.execute({ id: file.id, locale: 'en', altKey: 'unknown' })

    assert.equal(result.alt, 'First alt')
  })

  test('uses the override only when no alt entry is available', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    const file = await createFileWithAlts([])

    const result = await action.execute({ id: file.id, altOverride: 'Override alt' })

    assert.equal(result.alt, 'Override alt')
  })

  test('throws FileNotFoundException for an unknown id', async ({ assert }) => {
    const action = await app.container.make(FindFileAction)

    await assert.rejects(() => action.execute({ id: 999999 }), FileNotFoundException)
  })
})
