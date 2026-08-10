import { test } from '@japa/runner'
import sinon from 'sinon'
import FileTransformer from '#transformers/file_transformer'
import { ImageOptimizerService } from '#services/file/image_optimizer_service'
import { StorageService } from '#services/file/storage_service'
import CmsFile from '#models/file/file'
import FileAlt from '#models/file/file_alt'
import type { ResolvedFile } from '#types/file'

/**
 * Unit tests for `FileTransformer`.
 * Focus: the render-ready output shape (url, variants, resolved alt, type)
 * produced when a display intent is provided.
 */
test.group('FileTransformer', (group) => {
  function makeFile(alts: Partial<FileAlt>[] = []): CmsFile {
    const file = new CmsFile()
    file.id = 1
    file.filename = 'hero.jpg'
    file.originalName = 'photo.jpg'
    file.mimeType = 'image/jpeg'
    file.extension = 'jpg'
    file.size = 2048
    file.path = 'cms/files/hero.jpg'
    file.disk = 'fs'

    const altInstances = alts.map((a) => {
      const alt = new FileAlt()
      Object.assign(alt, a)
      return alt
    })

    file.$setRelated('alts', altInstances)

    return file
  }

  async function render(file: CmsFile, options?: { locale?: string; altKey?: string | null }) {
    return (await new FileTransformer(file, options).toObject()) as unknown as ResolvedFile & {
      originalName: string
      createdAt: unknown
    }
  }

  group.each.setup(() => {
    sinon.stub(ImageOptimizerService.prototype, 'optimize').resolves({
      width: 800,
      height: 600,
      variants: { 400: 'https://cdn.example.com/hero-400.webp' },
    })
    sinon.stub(StorageService.prototype, 'url').resolves('https://cdn.example.com/hero.jpg')
  })

  group.each.teardown(() => sinon.restore())

  test('render output carries url, variants, resolved alt and type', async ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }])

    const result = await render(file, { locale: 'en', altKey: 'hero' })

    assert.equal(result.url, 'https://cdn.example.com/hero.jpg')
    assert.equal(result.alt, 'Hero alt')
    assert.equal(result.type, 'image')
    assert.property(result.variants, '400')
    assert.equal(result.width, 800)
    assert.equal(result.height, 600)
  })

  test('render output resolves alt through the shared chain', async ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'English alt' }])

    const result = await render(file, { locale: 'fr', altKey: 'hero' })

    assert.equal(result.alt, 'English alt')
  })

  test('non-render output keeps the lean admin/API shape', async ({ assert }) => {
    const file = makeFile([{ locale: 'en', key: 'hero', value: 'Hero alt' }])

    const result = await render(file)

    assert.equal(result.id, 1)
    assert.equal(result.filename, 'hero.jpg')
    assert.equal(result.originalName, 'photo.jpg')
    assert.equal(result.url, 'https://cdn.example.com/hero.jpg')
    assert.isUndefined(result.variants)
    assert.equal(result.alt, 'Hero alt')
    assert.equal(result.type, 'image')
  })
})
