import { test } from '@japa/runner'
import sinon from 'sinon'

/**
 * Unit tests for `DifferentialBackupStrategy`.
 *
 * All external dependencies are injected via constructor opts.
 */
test.group('DifferentialBackupStrategy', (group) => {
  group.each.teardown(() => {
    sinon.restore()
  })

  // ─── Fallback to full backup ──────────────────────────────────────────────

  test('execute() falls back to full backup when no full backup exists', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    // StorageUploader returns empty list — no backups found
    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([]),
    }
    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()
    const createDumpStub = sinon.stub().resolves()

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-full-2024.sql.gz.enc')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    // Mock FullBackupStrategy.execute so the fallback path resolves cleanly
    const fullModule = await import('#services/backup/full_backup_strategy')
    const fullExecuteStub = sinon.stub().resolves({
      success: true,
      filename: 'backup-full-2024.sql.gz.enc',
      type: 'full' as const,
      size: 1024,
      duration: 500,
      storage: 'fs',
    })
    sinon.stub(fullModule.FullBackupStrategy.prototype, 'execute').callsFake(fullExecuteStub)

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const strategy = new DifferentialBackupStrategy(context, logService, {
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
    assert.equal(result.type, 'full')
    assert.isTrue(logService.warn.calledOnce)
    assert.include(logService.warn.firstCall.args[0].message, 'No full backup found')
    // Verify the filename was regenerated with 'full' type before delegating
    assert.isTrue(
      (snapshotModule.SnapshotHelper.generateFilename as any).calledWith('full'),
      'generateFilename should be called with full type on fallback'
    )
  })

  // ─── Skip when no tables modified ─────────────────────────────────────────

  test('execute() skips when no tables have been modified', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const lastFullBackupDriveObject = {
      key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
      isDirectory: false,
    }

    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([lastFullBackupDriveObject] as any),
      getMetaData: sinon.stub().resolves({
        contentLength: 5000,
        lastModified: new Date('2024-01-01T02:00:00Z'),
      }),
    }

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 0 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()
    const createDumpStub = sinon.stub().resolves()

    // Mock DB — no modified tables
    const dbModule = await import('@adonisjs/lucid/services/db')
    sinon.stub(dbModule.default, 'connection').returns({
      rawQuery: sinon.stub().resolves({ rows: [] }),
    } as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const strategy = new DifferentialBackupStrategy(context, logService, {
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
    assert.equal(result.type, 'differential')
    assert.equal(result.size, 0)
    assert.equal(result.filename, '')
  })

  // ─── Differential pipeline ────────────────────────────────────────────────

  test('execute() runs differential pipeline when tables are modified', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const lastFullBackupDriveObject = {
      key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
      isDirectory: false,
    }

    const uploadStub = sinon.stub().resolves()
    const uploaderMock = {
      upload: uploadStub,
      listBackups: sinon.stub().resolves([lastFullBackupDriveObject] as any),
      getMetaData: sinon.stub().resolves({
        contentLength: 5000,
        lastModified: new Date('2024-01-01T02:00:00Z'),
      }),
    }

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 2048 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    // Mock DB — return modified tables
    const dbModule = await import('@adonisjs/lucid/services/db')
    const connStub = {
      rawQuery: sinon
        .stub()
        .onCall(0)
        .resolves({ rows: [{ table_name: 'public.users' }] }) // pg_stat_user_tables — modified
        .onCall(1)
        .resolves({ rows: [{ tablename: 'users' }] }) // pg_tables
        .resolves({ rows: [] }), // default for further calls
    }
    sinon.stub(dbModule.default, 'connection').returns(connStub as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const strategy = new DifferentialBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: sinon.stub().resolves(),
    })

    const result = await strategy.execute()

    assert.isTrue(result.success)
    assert.equal(result.type, 'differential')
    assert.equal(result.size, 2048)
    assert.isTrue(uploadStub.called)
  })

  test('execute() returns error result on mkdir failure', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([]),
    }
    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    // Only mkdir fails — listBackups is not an error source here
    const mkdirStub = sinon.stub().rejects(new Error('Disk full'))
    const statStub = sinon.stub().resolves({ size: 0 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()
    const createDumpStub = sinon.stub().resolves()

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const strategy = new DifferentialBackupStrategy(context, logService, {
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
    assert.equal(result.type, 'differential')
    assert.include(result.error, 'Disk full')
  })

  // ─── Temp file cleanup ────────────────────────────────────────────────────

  test('execute() cleans up all temp files after successful differential backup', async ({
    assert,
  }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const lastFullBackupDriveObject = {
      key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
      isDirectory: false,
    }

    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([lastFullBackupDriveObject] as any),
      getMetaData: sinon.stub().resolves({
        contentLength: 5000,
        lastModified: new Date('2024-01-01T02:00:00Z'),
      }),
    }

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 2048 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    const connStub = {
      rawQuery: sinon
        .stub()
        .onCall(0)
        .resolves({ rows: [{ table_name: 'public.users' }] })
        .onCall(1)
        .resolves({ rows: [{ tablename: 'users' }] })
        .resolves({ rows: [] }),
    }
    sinon.stub(dbModule.default, 'connection').returns(connStub as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const result = await new DifferentialBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: sinon.stub().resolves(),
    }).execute()

    assert.isTrue(result.success)
    // 1 explicit unlink (dump after compress) + cleanupTemp removes dump/compressed/encrypted/manifest = 5 calls total
    assert.equal(unlinkStub.callCount, 5)
  })

  test('execute() cleans up temp files on failure', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const lastFullBackupDriveObject = {
      key: 'backup/backup-full-2024-01-01-020000.sql.gz.enc',
      isDirectory: false,
    }

    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([lastFullBackupDriveObject] as any),
      getMetaData: sinon.stub().resolves({
        contentLength: 5000,
        lastModified: new Date('2024-01-01T02:00:00Z'),
      }),
    }

    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().rejects(new Error('Encryption failed')),
    }

    const mkdirStub = sinon.stub().resolves()
    const statStub = sinon.stub().resolves({ size: 1024 })
    const unlinkStub = sinon.stub().resolves()
    const writeFileStub = sinon.stub().resolves()

    const dbModule = await import('@adonisjs/lucid/services/db')
    const connStub = {
      rawQuery: sinon
        .stub()
        .onCall(0)
        .resolves({ rows: [{ table_name: 'public.users' }] })
        .onCall(1)
        .resolves({ rows: [{ tablename: 'users' }] })
        .resolves({ rows: [] }),
    }
    sinon.stub(dbModule.default, 'connection').returns(connStub as any)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon.stub(snapshotModule.SnapshotHelper, 'manifestFilename').returns('m.manifest.json')

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const result = await new DifferentialBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
      _mkdir: mkdirStub,
      _stat: statStub,
      _unlink: unlinkStub,
      _writeFile: writeFileStub,
      _createDatabaseDump: sinon.stub().resolves(),
    }).execute()

    assert.isFalse(result.success)
    // 1 explicit unlink (dump after compress) + cleanupTemp removes dump/compressed = 3 calls total
    assert.equal(unlinkStub.callCount, 3)
  })

  // ─── parseFilenameDate() ──────────────────────────────────────────────────

  test('parseFilenameDate() parses date and time components', async ({ assert }) => {
    const logService = { info: sinon.stub(), warn: sinon.stub(), error: sinon.stub() } as any

    const uploaderMock = {
      upload: sinon.stub().resolves(),
      listBackups: sinon.stub().resolves([]),
    }
    const snapshotHelperMock = {
      compress: sinon.stub().resolves('/tmp/d.sql.gz'),
      encrypt: sinon.stub().resolves('/tmp/d.sql.gz.enc'),
    }

    const context = {
      tempDir: '/tmp/backups',
      filename: 'backup-differential-2024.sql.gz.enc',
      strategyType: 'differential' as const,
    }

    const { DifferentialBackupStrategy } =
      await import('#services/backup/differential_backup_strategy')
    const strategy = new DifferentialBackupStrategy(context, logService, {
      _snapshotHelper: snapshotHelperMock as any,
      _uploader: uploaderMock as any,
    })

    // Access private method via prototype (TypeScript doesn't enforce private at runtime)
    const parseMethod = (strategy as any).parseFilenameDate.bind(strategy)
    const date = parseMethod('2024-06-15', '143022')

    assert.equal(date.getFullYear(), 2024)
    assert.equal(date.getMonth(), 5) // June is month 5 (0-indexed)
    assert.equal(date.getDate(), 15)
    assert.equal(date.getHours(), 14)
    assert.equal(date.getMinutes(), 30)
    assert.equal(date.getSeconds(), 22)
  })
})
