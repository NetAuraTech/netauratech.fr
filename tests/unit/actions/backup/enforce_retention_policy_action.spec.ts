import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { EnforceRetentionPolicyAction } from '#actions/backup/enforce_retention_policy_action'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'
import { mockDriveListing } from '#tests/helpers/mock_drive_listing'

test.group('EnforceRetentionPolicyAction', (group) => {
  group.each.setup(() => {
    drive.fake(backupConfig.storage.disk as any)
    const disk = drive.use(backupConfig.storage.disk) as any
    mockDriveListing(disk)
  })

  group.each.teardown(() => {
    drive.restore(backupConfig.storage.disk as any)
  })

  test('execute() returns empty result when no backups exist', async ({ assert }) => {
    const action = await app.container.make(EnforceRetentionPolicyAction)
    const result = await action.execute()

    assert.deepEqual(result, { deleted: [], kept: 0 })
  })

  test('execute() deletes old backups beyond retention limits', async ({ assert }) => {
    const disk = drive.use(backupConfig.storage.disk) as any
    const prefix = backupConfig.storage.prefix

    await disk.put(`${prefix}/backup-full-2024-01-15-143022.sql.gz.enc`, 'dummy content')
    await disk.put(`${prefix}/backup-differential-2024-01-16-100000.sql`, 'dummy')

    const action = await app.container.make(EnforceRetentionPolicyAction)
    const result = await action.execute({ daily: 7, weekly: 4, monthly: 3, yearly: 1 })

    assert.isArray(result.deleted)
    assert.isNumber(result.kept)
  })
})
