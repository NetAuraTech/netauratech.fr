import { test } from '@japa/runner'
import BackupService from '#services/backup/backup_service'
import { LogService } from '#services/logging/log_service'
import drive from '@adonisjs/drive/services/main'
import { DateTime, Settings } from 'luxon'
import backupConfig from '#config/backup'

test.group('BackupService — listBackups and cleanup', (group) => {
  let service: BackupService
  let logService: LogService

  group.each.setup(() => {
    // We use a fake log service to avoid spamming console during tests
    logService = new LogService()
    logService.info = () => {}
    logService.error = () => {}
    logService.warn = () => {}
    logService.debug = () => {}

    service = new BackupService(logService)

    // Ensure the prefix matches the config
    drive.fake(backupConfig.storage.disk)
  })

  group.each.teardown(() => {
    drive.restore(backupConfig.storage.disk)
    Settings.now = () => Date.now() // restore Luxon time
  })

  test('listBackups() parses filename dates and filters invalid files', async ({ assert }) => {
    const disk = drive.use(backupConfig.storage.disk)
    const prefix = backupConfig.storage.prefix

    // Valid full backup
    await disk.put(`${prefix}/backup-full-2024-01-15-143022.sql.gz.enc`, 'dummy content')

    // Valid differential backup
    await disk.put(`${prefix}/backup-differential-2024-01-16-100000.sql`, 'dummy')

    // Invalid files that should be ignored
    await disk.put(`${prefix}/random-file.txt`, 'ignore')
    await disk.put(`${prefix}/backup-invalid-2024-01-15-143022.sql`, 'ignore')
    await disk.put(`${prefix}/backup-full-invaliddate-143022.sql`, 'ignore')

    const backups = await service.listBackups()

    assert.lengthOf(backups, 2)

    // They are returned sorted by descending date
    assert.equal(backups[0].filename, 'backup-differential-2024-01-16-100000.sql')
    assert.equal(backups[0].type, 'differential')

    assert.equal(backups[1].filename, 'backup-full-2024-01-15-143022.sql.gz.enc')
    assert.equal(backups[1].type, 'full')
  })

  test('cleanup() retains backups according to policy and deletes the rest', async ({ assert }) => {
    const disk = drive.use(backupConfig.storage.disk)
    const prefix = backupConfig.storage.prefix

    // Fix time to a specific point: 2024-03-01T12:00:00Z
    const fixedNow = DateTime.fromISO('2024-03-01T12:00:00Z')
    Settings.now = () => fixedNow.toMillis()

    // Assuming daily=7, weekly=4, monthly=3
    const retention = backupConfig.retention

    // Create backups that should be KEPT:
    // 1. A daily backup within the last 'daily' days (e.g. 2 days ago)
    const dailyDate = fixedNow.minus({ days: 2 })
    const dailyName = `backup-full-${dailyDate.toFormat('yyyy-MM-dd')}-120000.sql`
    await disk.put(`${prefix}/${dailyName}`, 'keep')

    // 2. A weekly backup (Sunday) within the last 'weekly' weeks (e.g. last Sunday)
    // Find the last Sunday
    let lastSunday = fixedNow
    while (lastSunday.weekday !== 7) {
      lastSunday = lastSunday.minus({ days: 1 })
    }
    const weeklyName = `backup-full-${lastSunday.toFormat('yyyy-MM-dd')}-120000.sql`
    await disk.put(`${prefix}/${weeklyName}`, 'keep')

    // 3. A monthly backup (1st of the month) within the last 'monthly' months
    const lastMonth = fixedNow.minus({ months: 1 }).set({ day: 1 })
    const monthlyName = `backup-full-${lastMonth.toFormat('yyyy-MM-dd')}-120000.sql`
    await disk.put(`${prefix}/${monthlyName}`, 'keep')

    // Create backups that should be DELETED (outside all retention windows):
    // 1. Very old daily backup (e.g. 10 days ago, daily=7)
    // Make sure it's not a Sunday or 1st of the month to avoid falling into weekly/monthly
    let oldDaily = fixedNow.minus({ days: retention.daily + 3 })
    if (oldDaily.weekday === 7 || oldDaily.day === 1) oldDaily = oldDaily.minus({ days: 1 })
    const oldDailyName = `backup-full-${oldDaily.toFormat('yyyy-MM-dd')}-120000.sql`
    await disk.put(`${prefix}/${oldDailyName}`, 'delete')

    // 2. Very old weekly backup (Sunday, 10 weeks ago, weekly=4)
    const oldWeekly = lastSunday.minus({ weeks: retention.weekly + 5 })
    const oldWeeklyName = `backup-full-${oldWeekly.toFormat('yyyy-MM-dd')}-120000.sql`
    await disk.put(`${prefix}/${oldWeeklyName}`, 'delete')

    // Since we just wrote to fake disk, their meta.lastModified will be NOW (the real now).
    // The BackupService uses meta.lastModified || parseFilenameDate.
    // To make sure it uses the filename date or at least tests correctly,
    // wait, if lastModified is used, they will ALL be considered "now" and KEPT as daily!
    // We need to bypass `listAll` metadata or adjust our test to stub `listBackups`.

    // Since `listBackups` uses `getMetaData()` which returns the real upload time (which is "now"),
    // ALL files will be considered 0 days old!
    // To fix this in the test, we can override `listBackups` on the service instance specifically for this test.

    service.listBackups = async () => {
      // Return fake metadata parsed purely from filename to respect our fixed Luxon time
      return [
        {
          filename: dailyName,
          type: 'full',
          size: 10,
          createdAt: dailyDate.toJSDate(),
          path: `${prefix}/${dailyName}`,
        },
        {
          filename: weeklyName,
          type: 'full',
          size: 10,
          createdAt: lastSunday.toJSDate(),
          path: `${prefix}/${weeklyName}`,
        },
        {
          filename: monthlyName,
          type: 'full',
          size: 10,
          createdAt: lastMonth.toJSDate(),
          path: `${prefix}/${monthlyName}`,
        },
        {
          filename: oldDailyName,
          type: 'full',
          size: 10,
          createdAt: oldDaily.toJSDate(),
          path: `${prefix}/${oldDailyName}`,
        },
        {
          filename: oldWeeklyName,
          type: 'full',
          size: 10,
          createdAt: oldWeekly.toJSDate(),
          path: `${prefix}/${oldWeeklyName}`,
        },
      ]
    }

    const { deleted, kept, errors } = await service.cleanup()

    assert.equal(errors, 0)
    assert.equal(kept, 3)
    assert.equal(deleted, 2)

    // Verify exactly the right files were deleted from the fake disk
    assert.isTrue(await disk.exists(`${prefix}/${dailyName}`))
    assert.isTrue(await disk.exists(`${prefix}/${weeklyName}`))
    assert.isTrue(await disk.exists(`${prefix}/${monthlyName}`))

    assert.isFalse(await disk.exists(`${prefix}/${oldDailyName}`))
    assert.isFalse(await disk.exists(`${prefix}/${oldWeeklyName}`))
  })
})
