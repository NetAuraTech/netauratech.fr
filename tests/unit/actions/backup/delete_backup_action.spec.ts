import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { DeleteBackupAction } from '#actions/backup/delete_backup_action'
import drive from '@adonisjs/drive/services/main'
import backupConfig from '#config/backup'

test.group('DeleteBackupAction', (group) => {
  group.each.setup(() => {
    drive.fake(backupConfig.storage.disk as any)
  })

  group.each.teardown(() => {
    drive.restore(backupConfig.storage.disk as any)
  })

  test('execute() deletes backup file and returns true', async ({ assert }) => {
    const disk = drive.use(backupConfig.storage.disk as any)
    const prefix = backupConfig.storage.prefix

    await disk.put(`${prefix}/backup-full-2024-01-15-143022.sql.gz.enc`, 'dummy content')

    const action = await app.container.make(DeleteBackupAction)
    const result = await action.execute({ filename: 'backup-full-2024-01-15-143022.sql.gz.enc' })

    assert.isTrue(result)
  })
})
