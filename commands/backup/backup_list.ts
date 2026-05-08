import { BaseCommand, flags } from '@adonisjs/core/ace'
import { inject } from '@adonisjs/core'
import BackupService from '#services/backup/backup_service'

/**
 * Ace command that lists all backup archives found on the configured
 * Drive disk, sorted from most recent to oldest.
 *
 * Results are rendered as a table showing filename, type, size, and
 * creation date. The `--limit` flag can be used to cap the number of
 * rows displayed, which is useful for a quick "last N backups" overview.
 *
 * @example
 * node ace backup:list
 * node ace backup:list --limit=5
 * node ace backup:list -l 10
 */
@inject()
export default class BackupList extends BaseCommand {
  static commandName = 'backup:list'
  static description = 'List all available backups'

  static options = {
    startApp: true,
  }

  /**
   * Maximum number of backups to display.
   * When omitted, all backups are shown.
   */
  @flags.number({
    description: 'Limit the number of backups displayed',
    alias: 'l',
  })
  declare limit: number

  async run() {
    const backupService = await this.app.container.make(BackupService)

    try {
      let backups = await backupService.listBackups()

      if (backups.length === 0) {
        this.logger.info('No backups found')
        return
      }

      if (this.limit) {
        backups = backups.slice(0, this.limit)
      }

      const table = this.ui.table()
      table.head(['Filename', 'Type', 'Size', 'Created At'])

      for (const backup of backups) {
        const sizeInMB = (backup.size / (1024 * 1024)).toFixed(2)
        table.row([
          backup.filename,
          backup.type,
          `${sizeInMB} MB`,
          backup.createdAt.toLocaleString(),
        ])
      }

      table.render()
    } catch (error) {
      this.logger.error(`Failed to list backups: ${error.message}`)
      this.exitCode = 1
    }
  }
}
