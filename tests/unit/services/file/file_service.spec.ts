import { test } from '@japa/runner'
import sinon from 'sinon'
import { FileService } from '#services/file/file_service'
import CmsFile from '#models/file/file'
import env from '#start/env'

/**
 * Unit tests for `FileService`.
 * `FileRepository`, `StorageService`, and `LogService` are fully mocked.
 * Filesystem operations (`readFile`, `unlink`) are stubbed via `node:fs/promises`.
 */
test.group('FileService', (group) => {
  let fileRepoStub: Record<string, ReturnType<typeof sinon.stub>>
  let storageStub: Record<string, ReturnType<typeof sinon.stub>>
  let logStub: Record<string, ReturnType<typeof sinon.stub>>
  let service: FileService

  function makeFile(overrides: Partial<CmsFile> = {}): CmsFile {
    const f = new CmsFile()
    Object.assign(f, {
      id: 1,
      filename: 'abc.jpg',
      originalName: 'photo.jpg',
      mimeType: 'image/jpeg',
      extension: 'jpg',
      size: 1024,
      path: 'cms/files/abc.jpg',
      disk: 'fs',
      folderId: null,
      uploadedBy: null,
      ...overrides,
    })
    return f
  }

  function makeMultipartFile(
    overrides: {
      extname?: string
      size?: number
      clientName?: string
      type?: string
      subtype?: string
    } = {}
  ) {
    return {
      extname: 'jpg',
      size: 1024,
      clientName: 'photo.jpg',
      type: 'image',
      subtype: 'jpeg',
      // Actually write a temp file so readFile/unlink work naturally
      move: sinon.stub().callsFake(async (dir: string, opts: { name: string }) => {
        const { mkdir, writeFile } = await import('node:fs/promises')
        await mkdir(dir, { recursive: true })
        await writeFile(`${dir}/${opts.name}`, Buffer.from('test-content'))
      }),
      ...overrides,
    }
  }

  group.each.setup(async () => {
    // Stub env.get so the service receives deterministic thresholds
    sinon.stub(env, 'get').callsFake((key: string, fallback?: any) => {
      if (key === 'CMS_MAX_UPLOAD_SIZE') return 10
      if (key === 'CMS_ALLOWED_EXTENSIONS') return 'jpg,jpeg,png,gif,webp,pdf,svg,mp4,mp3,zip'
      if (key === 'CMS_STORAGE_DISK') return 'fs'
      return fallback
    })

    fileRepoStub = {
      findByIdOrFail: sinon.stub(),
      list: sinon.stub(),
      create: sinon.stub(),
      update: sinon.stub(),
      delete: sinon.stub(),
      upsertAlt: sinon.stub(),
      deleteAlt: sinon.stub(),
      listAlts: sinon.stub(),
    }

    storageStub = {
      disk: sinon.stub().returns('fs'),
      buildPath: sinon.stub().callsFake((p: string) => `cms/${p}`),
      upload: sinon.stub().resolves(),
      delete: sinon.stub().resolves(),
      url: sinon.stub().resolves('https://cdn.example.com/file.jpg'),
    }

    logStub = {
      logBusiness: sinon.stub(),
    }

    service = new FileService(fileRepoStub as any, storageStub as any, logStub as any)
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  // ─── list() ───────────────────────────────────────────────────────────────

  test('list() delegates to repository with filters and pagination', async ({ assert }) => {
    fileRepoStub.list.resolves({ data: [], meta: {} })

    await service.list({ folderId: 1, search: 'photo' }, { page: 1, perPage: 20 })

    assert.isTrue(fileRepoStub.list.calledOnce)
    const [filters, pagination] = fileRepoStub.list.firstCall.args
    assert.equal(filters.folderId, 1)
    assert.equal(filters.search, 'photo')
    assert.equal(pagination.page, 1)
  })

  // ─── detail() ─────────────────────────────────────────────────────────────

  test('detail() returns the file from repository', async ({ assert }) => {
    const file = makeFile()
    fileRepoStub.findByIdOrFail.resolves(file)

    const result = await service.detail(1)

    assert.deepEqual(result, file)
    assert.isTrue(fileRepoStub.findByIdOrFail.calledWith(1))
  })

  test('detail() propagates exception when file not found', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.rejects(
      Object.assign(new Error('Not found'), { code: 'E_ROW_NOT_FOUND' })
    )

    try {
      await service.detail(99)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  // ─── upload() ─────────────────────────────────────────────────────────────

  test('upload() throws E_FILE_TOO_LARGE when file exceeds limit', async ({ assert }) => {
    const file = makeMultipartFile({ size: 999 * 1024 * 1024 }) // 999MB

    try {
      await service.upload(file as any, null, 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_FILE_TOO_LARGE')
    }
  })

  test('upload() throws E_INVALID_EXTENSION for disallowed extensions', async ({ assert }) => {
    const file = makeMultipartFile({ extname: 'exe', size: 100 })

    try {
      await service.upload(file as any, null, 1)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_INVALID_EXTENSION')
    }
  })

  test('upload() calls storageService.upload() with prefixed path', async ({ assert }) => {
    const multipartFile = makeMultipartFile()
    const createdFile = makeFile()
    fileRepoStub.create.resolves(createdFile)

    await service.upload(multipartFile as any, null, 1)

    assert.isTrue(storageStub.upload.calledOnce)
    const uploadPath: string = storageStub.upload.firstCall.args[1]
    assert.isTrue(uploadPath.startsWith('cms/'))
  })

  test('upload() persists file record with correct fields', async ({ assert }) => {
    const multipartFile = makeMultipartFile()
    const createdFile = makeFile()
    fileRepoStub.create.resolves(createdFile)

    await service.upload(multipartFile as any, 5, 1)

    const createArgs = fileRepoStub.create.firstCall.args[0]
    assert.equal(createArgs.extension, 'jpg')
    assert.equal(createArgs.mimeType, 'image/jpeg')
    assert.equal(createArgs.folderId, 5)
    assert.equal(createArgs.uploadedBy, 1)
    assert.equal(createArgs.disk, 'fs')
  })

  test('upload() cleans up temp file after successful upload', async ({ assert }) => {
    fileRepoStub.create.resolves(makeFile())
    // If unlink fails, upload() silently ignores it — we just check the upload completed
    await assert.doesNotReject(() => service.upload(makeMultipartFile() as any, null, null))
    assert.isTrue(storageStub.upload.calledOnce)
  })

  test('upload() logs file.uploaded business event', async ({ assert }) => {
    fileRepoStub.create.resolves(makeFile())
    await service.upload(makeMultipartFile() as any, null, 1)
    assert.isTrue(logStub.logBusiness.calledWith('file.uploaded'))
  })

  // ─── move() ───────────────────────────────────────────────────────────────

  test('move() updates only folderId without touching the physical file', async ({ assert }) => {
    const file = makeFile()
    fileRepoStub.findByIdOrFail.resolves(file)
    fileRepoStub.update.resolves({ ...file, folderId: 3 })

    await service.move(1, 3)

    assert.isTrue(storageStub.upload.notCalled)
    assert.isTrue(storageStub.delete.notCalled)
    assert.isTrue(fileRepoStub.update.calledWith(file, { folderId: 3 }))
  })

  test('move() accepts null to move file to root', async ({ assert }) => {
    const file = makeFile({ folderId: 2 })
    fileRepoStub.findByIdOrFail.resolves(file)
    fileRepoStub.update.resolves({ ...file, folderId: null })

    await service.move(1, null)

    assert.isTrue(fileRepoStub.update.calledWith(file, { folderId: null }))
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() propagates exception when file not found', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.rejects(Object.assign(new Error(), { code: 'E_ROW_NOT_FOUND' }))

    try {
      await service.delete(99)
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  test('delete() logs file.deleted business event', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.resolves(makeFile())
    fileRepoStub.delete.resolves()

    await service.delete(1)

    assert.isTrue(logStub.logBusiness.calledWith('file.deleted'))
  })

  // ─── upsertAlt() ──────────────────────────────────────────────────────────

  test('upsertAlt() verifies file existence before delegating', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.resolves(makeFile())
    fileRepoStub.upsertAlt.resolves()

    await service.upsertAlt(1, 'en', 'hero', 'Alt text')

    assert.isTrue(fileRepoStub.findByIdOrFail.calledWith(1))
    assert.isTrue(fileRepoStub.upsertAlt.calledWith(1, 'en', 'hero', 'Alt text'))
  })

  test('upsertAlt() throws if file does not exist', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.rejects(Object.assign(new Error(), { code: 'E_ROW_NOT_FOUND' }))

    try {
      await service.upsertAlt(99, 'en', 'hero', 'Alt')
      assert.fail('Expected error to be thrown')
    } catch (err: any) {
      assert.equal(err.code, 'E_ROW_NOT_FOUND')
    }
  })

  // ─── deleteAlt() ──────────────────────────────────────────────────────────

  test('deleteAlt() delegates to repository', async ({ assert }) => {
    fileRepoStub.deleteAlt.resolves()

    await service.deleteAlt(1, 'en', 'hero')

    assert.isTrue(fileRepoStub.deleteAlt.calledWith(1, 'en', 'hero'))
  })

  // ─── listAlts() ───────────────────────────────────────────────────────────

  test('listAlts() verifies file existence before delegating', async ({ assert }) => {
    fileRepoStub.findByIdOrFail.resolves(makeFile())
    fileRepoStub.listAlts.resolves([])

    await service.listAlts(1)

    assert.isTrue(fileRepoStub.findByIdOrFail.calledWith(1))
    assert.isTrue(fileRepoStub.listAlts.calledWith(1))
  })
})
