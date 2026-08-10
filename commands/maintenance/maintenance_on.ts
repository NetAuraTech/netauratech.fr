import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * ACE command to enable maintenance mode.
 *
 * Usage:
 * node ace maintenance:on
 * node ace maintenance:on --message="Deploy v2.3.0" --allowed-ips="10.0.0.0/8,192.168.1.0/24"
 * node ace maintenance:on --force-memory --message="Emergency maintenance"
 */
export default class MaintenanceOn extends BaseCommand {
  static commandName = 'maintenance:on'
  static description = 'Enable maintenance mode'

  static options: CommandOptions = {
    startApp: true,
    allowUnknownFlags: false,
  }

  @flags.string({ alias: 'm', description: 'Maintenance message' })
  declare message?: string

  @flags.string({ alias: 'i', description: 'Comma-separated CIDR allowlist' })
  declare allowedIps?: string

  @flags.boolean({ alias: 'f', description: 'Force enable on memory fallback (Redis unavailable)' })
  declare forceMemory?: boolean

  async run() {
    const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService)

    const redisAvailable = maintenanceService.isRedisAvailable()

    if (!redisAvailable && !this.forceMemory) {
      this.logger.error(
        'Cannot enable maintenance: Redis unavailable and no explicit memory override.'
      )
      this.logger.info('Use --force-memory to override (not recommended for production).')
      this.exitCode = 1
      return
    }

    const message =
      this.message ||
      (await this.prompt.ask('Enter maintenance message:')) ||
      'Application is under maintenance.'
    const allowedIpsInput =
      this.allowedIps || (await this.prompt.ask('Enter allowed IPs (comma-separated CIDR):')) || ''
    const allowedIps = allowedIpsInput
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => ip.length > 0)

    try {
      await maintenanceService.setConfig({
        enabled: true,
        message: message.slice(0, 500),
        allowedIps,
      })

      this.logger.success('Maintenance mode ENABLED')
      this.logger.info(`Message: ${message.slice(0, 500)}`)
      this.logger.info(`Allowed IPs: ${allowedIps.length > 0 ? allowedIps.join(', ') : '(none)'}`)
      this.logger.info(`Source: ${maintenanceService.getSource()}`)

      if (!redisAvailable) {
        this.logger.warning('⚠️  Running on memory fallback. Changes lost on restart.')
      }
    } catch (error) {
      this.logger.error(`Failed to enable maintenance: ${error.message}`)
      this.logger.debug(error.stack)
      this.exitCode = 1
    }
  }
}
