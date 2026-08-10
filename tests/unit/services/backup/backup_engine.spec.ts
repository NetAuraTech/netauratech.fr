import { test } from '@japa/runner'
import sinon from 'sinon'
import { DateTime } from 'luxon'

/**
 * Unit tests for `BackupEngine`.
 *
 * Tests the strategy selection logic (explicit vs auto mode) and verifies
 * that the engine delegates to the correct strategy. Strategy execution
 * itself is stubbed — each strategy has its own test file.
 */
test.group('BackupEngine', (group) => {
  group.each.teardown(() => {
    sinon.restore()
  })

  // ─── Explicit full strategy ──────────────────────────────────────────────

  test('execute() delegates to FullBackupStrategy when strategyType is "full"', async ({
    assert,
  }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    // Mock SnapshotHelper.generateFilename
    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-full-2024-01-07-020000.sql.gz.enc')

    // Mock FullBackupStrategy.execute
    const fullModule = await import('#services/backup/full_backup_strategy')
    const executeStub = sinon.stub().resolves({
      success: true,
      filename: 'backup-full-2024-01-07-020000.sql.gz.enc',
      type: 'full' as const,
      size: 1024,
      duration: 500,
      storage: 'fs',
    })
    sinon.stub(fullModule.FullBackupStrategy.prototype, 'execute').callsFake(executeStub)

    const { BackupEngine } = await import('#services/backup/backup_engine')
    const engine = new BackupEngine('full', '/tmp/backups', logService)
    const result = await engine.execute()

    assert.isTrue(result.success)
    assert.equal(result.type, 'full')
    assert.isTrue(executeStub.calledOnce)
  })

  // ─── Explicit differential strategy ──────────────────────────────────────

  test('execute() delegates to DifferentialBackupStrategy when strategyType is "differential"', async ({
    assert,
  }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-differential-2024-01-08-020000.sql.gz.enc')

    // Mock DifferentialBackupStrategy.execute
    const diffModule = await import('#services/backup/differential_backup_strategy')
    const executeStub = sinon.stub().resolves({
      success: true,
      filename: 'backup-differential-2024-01-08-020000.sql.gz.enc',
      type: 'differential' as const,
      size: 512,
      duration: 300,
      storage: 'fs',
    })
    sinon.stub(diffModule.DifferentialBackupStrategy.prototype, 'execute').callsFake(executeStub)

    const { BackupEngine } = await import('#services/backup/backup_engine')
    const engine = new BackupEngine('differential', '/tmp/backups', logService)
    const result = await engine.execute()

    assert.isTrue(result.success)
    assert.equal(result.type, 'differential')
    assert.isTrue(executeStub.calledOnce)
  })

  // ─── Auto mode — resolves based on weekday ──────────────────────────────

  test('execute() resolves to full backup on Sunday (config fullBackupDay=0)', async ({
    assert,
  }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    // Mock DateTime.now() to return a Sunday
    // Luxon weekday 1 = Sunday; code converts to JS day 0 which matches config fullBackupDay=0
    const mockSunday = DateTime.fromISO('2024-01-07T02:00:00.000Z') as any // Sunday
    sinon.stub(DateTime, 'now').returns(mockSunday)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-full-2024-01-07-020000.sql.gz.enc')

    const fullModule = await import('#services/backup/full_backup_strategy')
    const executeStub = sinon.stub().resolves({
      success: true,
      filename: 'backup-full-2024-01-07-020000.sql.gz.enc',
      type: 'full' as const,
      size: 1024,
      duration: 500,
      storage: 'fs',
    })
    sinon.stub(fullModule.FullBackupStrategy.prototype, 'execute').callsFake(executeStub)

    const { BackupEngine } = await import('#services/backup/backup_engine')
    const engine = new BackupEngine('auto', '/tmp/backups', logService)
    const result = await engine.execute()

    assert.equal(result.type, 'full')
    assert.isTrue(executeStub.calledOnce)
  })

  test('execute() resolves to differential on a non-matching day', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    // Mock any date — since config=0 and Luxon weekday is 1-7, it never matches
    const mockMonday = DateTime.fromISO('2024-01-08T02:00:00.000Z') as any
    sinon.stub(DateTime, 'now').returns(mockMonday)

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-differential-2024-01-08-020000.sql.gz.enc')

    const diffModule = await import('#services/backup/differential_backup_strategy')
    const executeStub = sinon.stub().resolves({
      success: true,
      filename: 'backup-differential-2024-01-08-020000.sql.gz.enc',
      type: 'differential' as const,
      size: 512,
      duration: 300,
      storage: 'fs',
    })
    sinon.stub(diffModule.DifferentialBackupStrategy.prototype, 'execute').callsFake(executeStub)

    const { BackupEngine } = await import('#services/backup/backup_engine')
    const engine = new BackupEngine('auto', '/tmp/backups', logService)
    const result = await engine.execute()

    assert.isTrue(result.success)
    assert.equal(result.type, 'differential')
  })

  // ─── Error propagation ───────────────────────────────────────────────────

  test('execute() propagates failure result from the strategy', async ({ assert }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    const snapshotModule = await import('#services/backup/snapshot_helper')
    sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-full-2024-01-07-020000.sql.gz.enc')

    const fullModule = await import('#services/backup/full_backup_strategy')
    const executeStub = sinon.stub().resolves({
      success: false,
      filename: 'backup-full-2024-01-07-020000.sql.gz.enc',
      type: 'full' as const,
      size: 0,
      duration: 100,
      storage: 'fs',
      error: 'pg_dump failed',
    })
    sinon.stub(fullModule.FullBackupStrategy.prototype, 'execute').callsFake(executeStub)

    const { BackupEngine } = await import('#services/backup/backup_engine')
    const engine = new BackupEngine('full', '/tmp/backups', logService)
    const result = await engine.execute()

    assert.isFalse(result.success)
    assert.equal(result.type, 'full')
    assert.equal(result.error, 'pg_dump failed')
  })

  // ─── Context generation ──────────────────────────────────────────────────

  test('constructor generates context with correct filename via SnapshotHelper', async ({
    assert,
  }) => {
    const logService = { info: sinon.stub(), error: sinon.stub(), warn: sinon.stub() } as any

    const snapshotModule = await import('#services/backup/snapshot_helper')
    const generateStub = sinon
      .stub(snapshotModule.SnapshotHelper, 'generateFilename')
      .returns('backup-full-2024.sql.gz.enc')

    const { BackupEngine } = await import('#services/backup/backup_engine')
    new BackupEngine('full', '/tmp/backups', logService)

    // generateFilename should be called with the resolved strategy type
    assert.isTrue(generateStub.calledWith('full'))
  })
})
