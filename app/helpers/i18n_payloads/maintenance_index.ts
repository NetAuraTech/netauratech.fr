import type { I18nService } from '#services/i18n_service'

export function buildAdminMaintenanceIndexPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'admin.settings.maintenance.value',
    sub_title: 'admin.settings.maintenance.sub_title',
    status: {
      label: 'admin.settings.maintenance.status.label',
      inactive: 'admin.settings.maintenance.status.inactive',
      active_redis: 'admin.settings.maintenance.status.active_redis',
      active_memory: 'admin.settings.maintenance.status.active_memory',
    },
    source: {
      redis: 'admin.settings.maintenance.source.redis',
      memory: 'admin.settings.maintenance.source.memory',
      memory_warning: 'admin.settings.maintenance.source.memory_warning',
      redis_unavailable: 'admin.settings.maintenance.source.redis_unavailable',
    },
    toggle: {
      label: 'admin.settings.maintenance.toggle.label',
      enable: 'admin.settings.maintenance.toggle.enable',
      disable: 'admin.settings.maintenance.toggle.disable',
      is_enabled: 'admin.settings.maintenance.toggle.is_enabled',
      is_disabled: 'admin.settings.maintenance.toggle.is_disabled',
    },
    message: {
      label: 'admin.settings.maintenance.message.label',
      placeholder: 'admin.settings.maintenance.message.placeholder',
      value: 'admin.settings.maintenance.message.value',
    },
    allowed_ips: {
      label: 'admin.settings.maintenance.allowed_ips.label',
      placeholder: 'admin.settings.maintenance.allowed_ips.placeholder',
      help: 'admin.settings.maintenance.allowed_ips.help',
    },
    schedule: {
      title: 'admin.settings.maintenance.schedule.title',
      enable: 'admin.settings.maintenance.schedule.enable',
      start: 'admin.settings.maintenance.schedule.start',
      end: 'admin.settings.maintenance.schedule.end',
      help: 'admin.settings.maintenance.schedule.help',
    },
    submit: 'admin.settings.maintenance.submit',
    memory: {
      title: 'admin.settings.maintenance.memory.title',
      description: 'admin.settings.maintenance.memory.description',
    },
    redis_down: {
      title: 'admin.settings.maintenance.redis_down.title',
      description: 'admin.settings.maintenance.redis_down.description',
      help: 'admin.settings.maintenance.redis_down.help',
    },
  })
}

export function buildMaintenanceIndexPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'page.maintenance.title',
    default_message: 'page.maintenance.default_message',
    retry_in: 'page.maintenance.retry_in',
    retry_now: 'page.maintenance.retry_now',
  })
}
