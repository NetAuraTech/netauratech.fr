import { test } from '@japa/runner'
import { FileRepository } from '#repositories/file/file_repository'
import { FileFactory } from '#factories/file_factory'
import { FileFolderFactory } from '#factories/file_folder_factory'

/**
 * Integration tests for `FileRepository`.
 */
test.group('FileRepository', () => {
  const repo = new FileRepository()

  // ─── create() ─────────────────────────────────────────────────────────────

  test('create() inserts the file record', async ({ assert }) => {
    const file = await FileFactory.create()
    const found = await repo.findById(file.id)

    assert.isNotNull(found)
    assert.equal(found!.id, file.id)
  })

  // ─── findById() ───────────────────────────────────────────────────────────

  test('findById() preloads alts', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'Hero alt text')

    const found = await repo.findById(file.id)

    assert.isNotNull(found)
    assert.isArray(found!.alts)
    assert.lengthOf(found!.alts, 1)
    assert.equal(found!.alts[0].value, 'Hero alt text')
  })

  test('findById() returns null for non-existent id', async ({ assert }) => {
    const result = await repo.findById(999999)
    assert.isNull(result)
  })

  // ─── findByIdOrFail() ─────────────────────────────────────────────────────

  test('findByIdOrFail() returns file when found', async ({ assert }) => {
    const file = await FileFactory.create()
    const found = await repo.findByIdOrFail(file.id)
    assert.equal(found.id, file.id)
  })

  test('findByIdOrFail() throws when not found', async ({ assert }) => {
    await assert.rejects(() => repo.findByIdOrFail(999999))
  })

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() filters by folderId', async ({ assert }) => {
    const folder = await FileFolderFactory.create()
    const fileInFolder = await FileFactory.merge({ folderId: folder.id }).create()
    await FileFactory.merge({ folderId: null }).create()

    const result = await repo.list({ folderId: folder.id }, { page: 1, perPage: 20 })
    const ids = result.all().map((f: any) => f.id)

    assert.includeMembers(ids, [fileInFolder.id])
    assert.lengthOf(ids, 1)
  })

  test('list() returns root files when folderId is null', async ({ assert }) => {
    const folder = await FileFolderFactory.create()
    const rootFile = await FileFactory.merge({ folderId: null }).create()
    await FileFactory.merge({ folderId: folder.id }).create()

    const result = await repo.list({ folderId: null }, { page: 1, perPage: 20 })
    const ids = result.all().map((f: any) => f.id)

    assert.includeMembers(ids, [rootFile.id])
    for (const id of ids) {
      const file = result.all().find((f: any) => f.id === id)
      assert.isNull(file!.folderId)
    }
  })

  test('list() filters by mimeType prefix', async ({ assert }) => {
    const imageFile = await FileFactory.merge({ mimeType: 'image/jpeg', extension: 'jpg' }).create()
    await FileFactory.merge({ mimeType: 'application/pdf', extension: 'pdf' }).create()

    const result = await repo.list({ mimeType: 'image' }, { page: 1, perPage: 20 })
    const ids = result.all().map((f: any) => f.id)

    assert.includeMembers(ids, [imageFile.id])
    for (const file of result.all()) {
      assert.isTrue((file as any).mimeType.startsWith('image'))
    }
  })

  test('list() filters by search on originalName', async ({ assert }) => {
    const file = await FileFactory.merge({ originalName: 'holiday-photo.jpg' }).create()
    await FileFactory.merge({ originalName: 'document.pdf' }).create()

    const result = await repo.list({ search: 'holiday' }, { page: 1, perPage: 20 })
    const ids = result.all().map((f: any) => f.id)

    assert.includeMembers(ids, [file.id])
    assert.lengthOf(ids, 1)
  })

  test('list() filters by disk', async ({ assert }) => {
    const fileFs = await FileFactory.merge({ disk: 'fs' }).create()
    await FileFactory.merge({ disk: 's3' }).create()

    const result = await repo.list({ disk: 'fs' }, { page: 1, perPage: 20 })
    const ids = result.all().map((f: any) => f.id)

    assert.includeMembers(ids, [fileFs.id])
    for (const file of result.all()) {
      assert.equal((file as any).disk, 'fs')
    }
  })

  // ─── update() ─────────────────────────────────────────────────────────────

  test('update() modifies existing file', async ({ assert }) => {
    const file = await FileFactory.create()
    const folder = await FileFolderFactory.create()

    const updated = await repo.update(file, { originalName: 'new-name.png', folderId: folder.id })

    assert.equal(updated.originalName, 'new-name.png')
    assert.equal(updated.folderId, folder.id)

    const reloaded = await repo.findById(file.id)
    assert.equal(reloaded!.originalName, 'new-name.png')
  })

  // ─── upsertAlt() ──────────────────────────────────────────────────────────

  test('upsertAlt() creates a new alt entry', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'Hero alt')

    const alts = await repo.listAlts(file.id)
    assert.lengthOf(alts, 1)
    assert.equal(alts[0].value, 'Hero alt')
  })

  test('upsertAlt() updates existing entry for same file/locale/key', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'First value')
    await repo.upsertAlt(file.id, 'en', 'hero', 'Updated value')

    const alts = await repo.listAlts(file.id)
    assert.lengthOf(alts, 1)
    assert.equal(alts[0].value, 'Updated value')
  })

  test('upsertAlt() creates separate entries for different locales', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'English alt')
    await repo.upsertAlt(file.id, 'fr', 'hero', 'French alt')

    const alts = await repo.listAlts(file.id)
    assert.lengthOf(alts, 2)
  })

  // ─── deleteAlt() ──────────────────────────────────────────────────────────

  test('deleteAlt() removes only the exact locale/key pair', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'EN hero')
    await repo.upsertAlt(file.id, 'fr', 'hero', 'FR hero')

    await repo.deleteAlt(file.id, 'en', 'hero')

    const alts = await repo.listAlts(file.id)
    assert.lengthOf(alts, 1)
    assert.equal(alts[0].locale, 'fr')
  })

  // ─── listAlts() ───────────────────────────────────────────────────────────

  test('listAlts() returns alts ordered by locale then key', async ({ assert }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'fr', 'thumbnail', 'FR thumb')
    await repo.upsertAlt(file.id, 'en', 'hero', 'EN hero')
    await repo.upsertAlt(file.id, 'en', 'thumbnail', 'EN thumb')

    const alts = await repo.listAlts(file.id)

    assert.equal(alts[0].locale, 'en')
    assert.equal(alts[0].key, 'hero')
    assert.equal(alts[1].locale, 'en')
    assert.equal(alts[1].key, 'thumbnail')
    assert.equal(alts[2].locale, 'fr')
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() removes the DB record (physical deletion tested in model hooks)', async ({
    assert,
  }) => {
    const file = await FileFactory.create()
    await repo.upsertAlt(file.id, 'en', 'hero', 'Alt text')

    // Stub the beforeDelete hook to avoid actual storage calls
    const CmsFileModel = await import('#models/file/file')
    const originalHook = CmsFileModel.default.deletePhysicalFile
    CmsFileModel.default.deletePhysicalFile = async () => {}

    await repo.delete(file.id)

    CmsFileModel.default.deletePhysicalFile = originalHook

    const result = await repo.findById(file.id)
    assert.isNull(result)
  })
})
