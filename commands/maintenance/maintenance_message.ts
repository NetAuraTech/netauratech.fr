import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * ACE command to update the maintenance message.
 *
 * Usage:
 * node ace maintenance:message "New maintenance message"
 * node ace maintenance:message "Deploy v2.3.0 - back in 15min"
 */
export default class MaintenanceMessage extends BaseCommand {
  static commandName = 'maintenance:message'
  static description = 'Update maintenance message'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.string({ alias: 'm', description: 'New maintenance message' })
  declare message?: string

  async run() {
    const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService)

    const message = this.message || (await this.prompt.ask('Enter maintenance message:'))

    if (!message) {
      this.logger.error('Message is required')
      this.exitCode = 1
      return
    }

    try {
      await maintenanceService.setConfig({ message: message.slice(0, 500) })

      this.logger.success('Maintenance message updated')
      this.logger.info(`Message: ${message.slice(0, 500)}`)
      this.logger.info(`Source: ${maintenanceService.getSource()}`)
    } catch (error) {
      this.logger.error(`Failed to update message: ${error.message}`)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
