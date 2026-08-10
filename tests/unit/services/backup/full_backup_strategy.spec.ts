import { test } from '@japa/runner'
import sinon from 'sinon'

/**
 * Unit tests for `FullBackupStrategy`.
 *
 * All external dependencies are injected via constructor opts so we never
 * need to stub ESM imports.
 */
test.group('FullBackupStrategy', (group) => {
  group.each.teardown(() => {
    sinon.restore()
  })

  test('execute() runs the full pipeline on success', async ({ assert }) => {
    const logService = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
    } as any

    // Mock spawn for pg_dump
    const spawnStub = sinon.stub().returns({
      on: sinon.stub().callsArgWith(1, 0),
      stderr: { on: sinon.stub() },
    })

    // Mock createDatabaseDump that uses the spawn stub
    const { createDatabaseDump } = await import('#services/backup/dump_helper')
    const createDumpStub = sinon
      .stub()
      .callsFake((options) => createDatabaseDump(options, spawnStub))

    // Mock SnapshotHelper methods
    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/compressed.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/compressed.sql.gz.enc'),
    }

    // Mock StorageUploader
    const uploaderMock = {
      upload: sinon.stub().resolves(),
      buildPath: sinon.stub().returns('backup/test.sql'),
    }

    // Mock fs functions
    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 4096 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    // Mock DB query for table list — patch the import at runtime
    const dbModule = await import('@adonisjs/lucid/services/db')
    const connStub = {
      rawQuery: sinon.stub().resolves({
        rows: [{ tablename: 'users' }, { tablename: 'posts' }],
      }),
    }
    sinon.stub(dbModule.default, 'connection').returns(connStub as any)

    // Mock SnapshotHelper.manifestFilename
    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'manifestFilename')
      .returns('backup-full-2024.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024-01-01-020000.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    const strategy = new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    })

    const result = await strategy.execute()

    assert.isTrue(result.success)
    assert.equal(result.filename, context.filename)
    assert.equal(result.type, 'full')
    assert.equal(result.size, 4096)
    assert.isNumber(result.duration)
  })

  test('execute() returns error result on failure', async ({ assert }) => {
    const logService = {
      info: sinon.stub(),
      error: sinon.stub(),
      warn: sinon.stub(),
    } as any

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }
    const uploaderMock = { upload: sinon.stub().resolves() }

    // Make mkdir throw to trigger the error path
    const mkdirStub = sinon.stub().rejects(new Error('Permission denied'))
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()
    const createDumpStub = sinon.stub().resolves()

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024-01-01-020000.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    const strategy = new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    })

    const result = await strategy.execute()

    assert.isFalse(result.success)
    assert.equal(result.type, 'full')
    assert.equal(result.size, 0)
    assert.include(result.error, 'Permission denied')
    assert.isTrue(logService.error.calledOnce)
  })

  test('execute() calls compress then encrypt in sequence', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub() } as any

    const spawnStub = sinon.stub().returns({
      on: sinon.stub().callsArgWith(1, 0),
      stderr: { on: sinon.stub() },
    })
    const { createDatabaseDump } = await import('#services/backup/dump_helper')
    const createDumpStub = sinon
      .stub()
      .callsFake((options) => createDatabaseDump(options, spawnStub))

    const compressStub = sinon.stub().resolves('/tmp/d.sql.gz')
    const encryptStub = sinon.stub().resolves('/tmp/d.sql.gz.enc')
    const snapshotHelperMock = { compress: compressStub, encrypt: encryptStub }

    const uploaderMock = { upload: sinon.stub().resolves() }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    sinon.stub(dbModule.default, 'connection').returns({
      rawQuery: sinon.stub().resolves({ rows: [] }),
    } as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    await new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    }).execute()

    assert.isTrue(compressStub.calledBefore(encryptStub))
  })

  test('execute() uploads encrypted file and manifest', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub() } as any

    const spawnStub = sinon.stub().returns({
      on: sinon.stub().callsArgWith(1, 0),
      stderr: { on: sinon.stub() },
    })
    const { createDatabaseDump } = await import('#services/backup/dump_helper')
    const createDumpStub = sinon
      .stub()
      .callsFake((options) => createDatabaseDump(options, spawnStub))

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const uploadStub = sinon.stub().resolves()
    const uploaderMock = { upload: uploadStub }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 512 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    sinon.stub(dbModule.default, 'connection').returns({
      rawQuery: sinon.stub().resolves({ rows: [{ tablename: 'users' }] }),
    } as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    await new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    }).execute()

    // Should upload encrypted file and manifest (2 uploads)
    assert.equal(uploadStub.callCount, 2)
    assert.equal(uploadStub.firstCall.args[1], 'backup-full-2024.sql.gz.enc')
    assert.equal(uploadStub.secondCall.args[1], 'm.manifest.json')
  })

  test('execute() logs success with metadata', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub() } as any

    const spawnStub = sinon.stub().returns({
      on: sinon.stub().callsArgWith(1, 0),
      stderr: { on: sinon.stub() },
    })
    const { createDatabaseDump } = await import('#services/backup/dump_helper')
    const createDumpStub = sinon
      .stub()
      .callsFake((options) => createDatabaseDump(options, spawnStub))

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }
    const uploaderMock = { upload: sinon.stub().resolves() }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 2048 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    sinon.stub(dbModule.default, 'connection').returns({
      rawQuery: sinon.stub().resolves({ rows: [] }),
    } as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    await new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    }).execute()

    // Second info call is the "completed" log with metadata
    assert.isTrue(logService.info.callCount >= 2)
    const successLog = logService.info.getCall(1)
    assert.equal(successLog.args[0].message, 'Backup completed successfully')
    assert.equal(successLog.args[0].metadata.size, 2048)
  })

  test('execute() cleans up all temp files after success', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub() } as any

    const spawnStub = sinon.stub().returns({
      on: sinon.stub().callsArgWith(1, 0),
      stderr: { on: sinon.stub() },
    })
    const { createDatabaseDump } = await import('#services/backup/dump_helper')
    const createDumpStub = sinon
      .stub()
      .callsFake((options) => createDatabaseDump(options, spawnStub))

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }
    const uploaderMock = { upload: sinon.stub().resolves() }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    sinon.stub(dbModule.default, 'connection').returns({
      rawQuery: sinon.stub().resolves({ rows: [] }),
    } as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    await new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    }).execute()

    // 1 explicit unlink (dump after compress) + cleanupTemp removes dump/compressed/encrypted/manifest = 5 calls total
    assert.equal(unlinkStub.callCount, 5)
  })

  test('execute() cleans up temp files on failure', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub() } as any

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().rejects(new Error('Encryption failed')),
    }
    const uploaderMock = { upload: sinon.stub().resolves() }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    // Mock pg_dump to succeed so failure happens later in the pipeline
    const createDumpStub = sinon.stub().resolves()

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-full-2024.sql.gz.enc',
      strategyType: 'full' as const,
    }

    const { FullBackupStrategy } = await import('#services/backup/full_backup_strategy')
    const result = await new FullBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: createDumpStub,
    }).execute()

    assert.isFalse(result.success)
    // 1 explicit unlink (dump after compress) + cleanupTemp removes dump/compressed = 3 calls total
    assert.equal(unlinkStub.callCount, 3)
  })
})
