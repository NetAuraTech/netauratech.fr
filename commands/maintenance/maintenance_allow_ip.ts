import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * ACE command to add an IP to the maintenance allowlist.
 *
 * Usage:
 * node ace maintenance:allow-ip 192.168.1.0/24
 * node ace maintenance:allow-ip 10.0.0.5/32
 */
export default class MaintenanceAllowIp extends BaseCommand {
  static commandName = 'maintenance:allow-ip'
  static description = 'Add IP/CIDR to maintenance allowlist'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.string({ alias: 'a', description: 'IP/CIDR to allow' })
  declare cidr?: string

  async run() {
    const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService)

    const cidr = this.cidr || (await this.prompt.ask('Enter IP/CIDR to allow:'))

    if (!cidr) {
      this.logger.error('CIDR is required')
      this.exitCode = 1
      return
    }

    const config = await maintenanceService.getConfig()

    if (config.allowedIps.includes(cidr)) {
      this.logger.warning(`IP/CIDR already in allowlist: ${cidr}`)
      return
    }

    const updatedIps = [...config.allowedIps, cidr]

    try {
      await maintenanceService.setConfig({ allowedIps: updatedIps })

      this.logger.success(`Added to allowlist: ${cidr}`)
      this.logger.info(`Source: ${maintenanceService.getSource()}`)
    } catch (error) {
      this.logger.error(`Failed to add IP: ${error.message}`)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
