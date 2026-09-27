import { test } from '@japa/runner'
import sinon from 'sinon'
import { StorageService } from '#services/file/storage_service'

/**
 * Unit tests for `StorageService`.
 * AdonisJS Drive is fully mocked — no filesystem or network I/O.
 */
test.group('StorageService', (group) => {
  let driveStub: {
    put: ReturnType<typeof sinon.stub>
    delete: ReturnType<typeof sinon.stub>
    getUrl: ReturnType<typeof sinon.stub>
    exists: ReturnType<typeof sinon.stub>
  }
  let driveUseStub: ReturnType<typeof sinon.stub>
  let service: StorageService

  group.each.setup(async () => {
    driveStub = {
      put: sinon.stub().resolves(),
      delete: sinon.stub().resolves(),
      getUrl: sinon.stub().resolves('https://cdn.example.com/files/photo.jpg'),
      exists: sinon.stub().resolves(true),
    }

    const driveModule = await import('@adonisjs/drive/services/main')
    driveUseStub = sinon.stub(driveModule.default, 'use').returns(driveStub as any)

    service = new StorageService()
  })

  group.each.teardown(() => {
    sinon.restore()
  })

  // ─── disk() ───────────────────────────────────────────────────────────────

  test('disk() returns value from DRIVE_DISK env', async ({ assert }) => {
    const envModule = await import('#start/env')
    const envStub = sinon
      .stub(envModule.default, 'get')
      .callsFake((key: string, defaultValue: string) => process.env[key] ?? defaultValue)
    const original = process.env.DRIVE_DISK
    process.env.DRIVE_DISK = 's3'
    try {
      assert.equal(service.disk(), 's3')
    } finally {
      envStub.restore()
      if (original !== undefined) process.env.DRIVE_DISK = original
      else delete process.env.DRIVE_DISK
    }
  })

  test('disk() falls back to local when DRIVE_DISK is unset', async ({ assert }) => {
    // Simulate a live env read: an unset DRIVE_DISK makes Env return the 'fs' default
    const envModule = await import('#start/env')
    const envStub = sinon
      .stub(envModule.default, 'get')
      .callsFake((key: string, defaultValue: string) => process.env[key] ?? defaultValue)
    const original = process.env.DRIVE_DISK
    delete process.env.DRIVE_DISK
    try {
      assert.equal(service.disk(), 'fs')
    } finally {
      envStub.restore()
      if (original !== undefined) process.env.DRIVE_DISK = original
    }
  })

  // ─── buildPath() ──────────────────────────────────────────────────────────

  test('buildPath() returns the path unchanged', ({ assert }) => {
    assert.equal(service.buildPath('files/photo.jpg'), 'files/photo.jpg')
  })

  test('buildPath() works with nested paths', ({ assert }) => {
    assert.equal(service.buildPath('a/b/c.pdf'), 'a/b/c.pdf')
  })

  // ─── upload() ─────────────────────────────────────────────────────────────

  test('upload() calls drive.use(disk).put() with correct arguments', async ({ assert }) => {
    const contents = Buffer.from('file contents')
    await service.upload(contents, 'files/test.jpg', 'fs', { contentType: 'image/jpeg' })

    assert.isTrue(driveUseStub.calledWith('fs'))
    assert.isTrue(driveStub.put.calledOnce)
    assert.equal(driveStub.put.firstCall.args[0], 'files/test.jpg')
    assert.deepEqual(driveStub.put.firstCall.args[1], contents)
    assert.equal(driveStub.put.firstCall.args[2].contentType, 'image/jpeg')
  })

  test('upload() defaults visibility to public', async ({ assert }) => {
    await service.upload(Buffer.from(''), 'files/test.jpg', 'fs')
    assert.equal(driveStub.put.firstCall.args[2].visibility, 'public')
  })

  test('upload() passes provided visibility option', async ({ assert }) => {
    await service.upload(Buffer.from(''), 'files/test.jpg', 'fs', { visibility: 'private' })
    assert.equal(driveStub.put.firstCall.args[2].visibility, 'private')
  })

  // ─── delete() ─────────────────────────────────────────────────────────────

  test('delete() calls drive.use(disk).delete() with correct path', async ({ assert }) => {
    await service.delete('files/test.jpg', 'fs')
    assert.isTrue(driveStub.delete.calledWith('files/test.jpg'))
  })

  test('delete() does not throw when file does not exist', async ({ assert }) => {
    driveStub.delete.rejects(new Error('File not found'))
    await assert.doesNotReject(() => service.delete('files/missing.jpg', 'fs'))
  })

  // ─── url() ────────────────────────────────────────────────────────────────

  test('url() returns the URL from the driver', async ({ assert }) => {
    const url = await service.url('files/photo.jpg', 'fs')
    assert.equal(url, 'https://cdn.example.com/files/photo.jpg')
    assert.isTrue(driveStub.getUrl.calledWith('files/photo.jpg'))
  })

  // ─── exists() ─────────────────────────────────────────────────────────────

  test('exists() returns true when driver reports file exists', async ({ assert }) => {
    driveStub.exists.resolves(true)
    const result = await service.exists('files/photo.jpg', 'fs')
    assert.isTrue(result)
  })

  test('exists() returns false when driver reports file is missing', async ({ assert }) => {
    driveStub.exists.resolves(false)
    const result = await service.exists('files/missing.jpg', 'fs')
    assert.isFalse(result)
  })
})
