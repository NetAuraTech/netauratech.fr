import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * ACE command to disable maintenance mode.
 *
 * Usage:
 * node ace maintenance:off
 */
export default class MaintenanceOff extends BaseCommand {
  static commandName = 'maintenance:off'
  static description = 'Disable maintenance mode'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  async run() {
    const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService)

    try {
      await maintenanceService.setConfig({ enabled: false })

      this.logger.success('Maintenance mode DISABLED')
      this.logger.info(`Source: ${maintenanceService.getSource()}`)

      if (!maintenanceService.isRedisAvailable()) {
        this.logger.warning('⚠️  Running on memory fallback. Changes lost on restart.')
      }
    } catch (error) {
      this.logger.error(`Failed to disable maintenance: ${error.message}`)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
