import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * ACE command to remove an IP from the maintenance allowlist.
 *
 * Usage:
 * node ace maintenance:remove-ip 192.168.1.0/24
 * node ace maintenance:remove-ip 10.0.0.5/32
 */
export default class MaintenanceRemoveIp extends BaseCommand {
  static commandName = 'maintenance:remove-ip'
  static description = 'Remove IP/CIDR from maintenance allowlist'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.string({ alias: 'r', description: 'IP/CIDR to remove' })
  declare cidr?: string

  async run() {
    const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService)

    const cidr = this.cidr || (await this.prompt.ask('Enter IP/CIDR to remove:'))

    if (!cidr) {
      this.logger.error('CIDR is required')
      this.exitCode = 1
      return
    }

    const config = await maintenanceService.getConfig()

    if (!config.allowedIps.includes(cidr)) {
      this.logger.warning(`IP/CIDR not found in allowlist: ${cidr}`)
      return
    }

    const updatedIps = config.allowedIps.filter((ip) => ip !== cidr)

    try {
      await maintenanceService.setConfig({ allowedIps: updatedIps })

      this.logger.success(`Removed from allowlist: ${cidr}`)
      this.logger.info(`Source: ${maintenanceService.getSource()}`)
    } catch (error) {
      this.logger.error(`Failed to remove IP: ${error.message}`)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
