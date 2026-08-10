import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { MaintenanceService } from '#services/maintenance/maintenance_service'
import type { MaintenanceConfig } from '#types/maintenance'
import { LogService } from '#services/logging/log_service'
import { I18nService } from '#services/i18n_service'
import { buildAdminMaintenanceIndexPayload } from '#helpers/i18n_payloads/maintenance_index'

/**
 * Maintenance admin controller.
 * Handles GET/POST for maintenance configuration.
 */
@inject()
export default class MaintenanceController {
  constructor(
    protected i18n: I18nService,
    protected maintenanceService: MaintenanceService,
    protected logService: LogService
  ) {}

  /**
   * Render maintenance admin page (Inertia).
   */
  async render({ inertia }: HttpContext) {
    const config = await this.maintenanceService.getConfig()
    const effectiveConfig = await this.maintenanceService.getEffectiveConfig()
    const memoryConfig = this.maintenanceService.getMemoryConfig()

    // Strip internal fields before passing to frontend. When no memory config
    // is set, keep the prop undefined so the page renders its default state.
    let memoryConfigDto:
      | {
          enabled: boolean
          message: string
          allowedIps: string[]
          updatedAt: string
        }
      | undefined

    if (memoryConfig) {
      memoryConfigDto = {
        enabled: memoryConfig.enabled,
        message: memoryConfig.message,
        allowedIps: memoryConfig.allowedIps,
        updatedAt: memoryConfig.updatedAt.toISOString(),
      }
    }

    return inertia.render('maintenance/admin/index', {
      config,
      effectiveEnabled: effectiveConfig.enabled,
      memoryConfig: memoryConfigDto,
      redisAvailable: this.maintenanceService.isRedisAvailable(),
      source: this.maintenanceService.getSource(),
      translations: buildAdminMaintenanceIndexPayload(this.i18n),
    })
  }

  /**
   * Update maintenance configuration via form POST.
   */
  async update({ request, response, session }: HttpContext) {
    const enabled = request.input('enabled', false)
    const message = (request.input('message', '') ?? '').slice(0, 500)
    const allowedIpsInput = request.input('allowed_ips', '') ?? ''
    const allowedIps = allowedIpsInput
      .split('\n')
      .map((ip: string) => ip.trim())
      .filter((ip: string) => ip.length > 0)

    // Scheduled maintenance window
    const scheduleEnabled = request.input('schedule_enabled', false) === 'on'
    const startAt = request.input('start_at', '') ?? ''
    const endAt = request.input('end_at', '') ?? ''

    const scheduled: MaintenanceConfig['scheduled'] =
      scheduleEnabled && startAt && endAt
        ? {
            enabled: true,
            startAt: new Date(startAt).toISOString(),
            endAt: new Date(endAt).toISOString(),
          }
        : { enabled: false, startAt: '', endAt: '' }

    try {
      await this.maintenanceService.setConfig({
        enabled,
        message,
        allowedIps,
        scheduled,
      })
    } catch (error) {
      session.flash(
        'error',
        error instanceof RangeError
          ? error.message
          : 'Maintenance configuration could not be saved.'
      )
      return response.redirect().back()
    }

    this.logService.logBusiness('settings.maintenance.updated', {
      enabled,
      allowedIpsCount: allowedIps.length,
      scheduleEnabled: scheduled.enabled,
    })

    session.flash('success', 'Maintenance settings saved.')
    return response.redirect().back()
  }

  /**
   * Toggle maintenance mode on/off.
   */
  async toggle({ request, response, session }: HttpContext) {
    const enabled = request.input('enabled', false)

    await this.maintenanceService.toggle(enabled)

    this.logService.logBusiness('settings.maintenance.toggled', { enabled })

    session.flash('success', enabled ? 'Maintenance mode enabled.' : 'Maintenance mode disabled.')
    return response.redirect().back()
  }
}
