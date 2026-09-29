import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin maintenance settings page.
 */
export const ADMIN_MAINTENANCE_MAPPING = {
	title: 'maintenance.admin.value',
	sub_title: 'maintenance.admin.sub_title',
	status: {
		label: 'maintenance.admin.status.label',
		inactive: 'maintenance.admin.status.inactive',
		active_redis: 'maintenance.admin.status.active_redis',
		active_memory: 'maintenance.admin.status.active_memory',
	},
	source: {
		redis: 'maintenance.admin.source.redis',
		memory: 'maintenance.admin.source.memory',
		memory_warning: 'maintenance.admin.source.memory_warning',
		redis_unavailable: 'maintenance.admin.source.redis_unavailable',
	},
	toggle: {
		label: 'maintenance.admin.toggle.label',
		enable: 'maintenance.admin.toggle.enable',
		disable: 'maintenance.admin.toggle.disable',
		is_enabled: 'maintenance.admin.toggle.is_enabled',
		is_disabled: 'maintenance.admin.toggle.is_disabled',
	},
	message: {
		label: 'maintenance.admin.message.label',
		placeholder: 'maintenance.admin.message.placeholder',
		value: 'maintenance.admin.message.value',
	},
	allowed_ips: {
		label: 'maintenance.admin.allowed_ips.label',
		placeholder: 'maintenance.admin.allowed_ips.placeholder',
		help: 'maintenance.admin.allowed_ips.help',
	},
	schedule: {
		title: 'maintenance.admin.schedule.title',
		enable: 'maintenance.admin.schedule.enable',
		start: 'maintenance.admin.schedule.start',
		end: 'maintenance.admin.schedule.end',
		help: 'maintenance.admin.schedule.help',
	},
	submit: 'maintenance.admin.submit',
	memory: {
		title: 'maintenance.admin.memory.title',
		description: 'maintenance.admin.memory.description',
	},
	redis_down: {
		title: 'maintenance.admin.redis_down.title',
		description: 'maintenance.admin.redis_down.description',
		help: 'maintenance.admin.redis_down.help',
	},
};

/**
 * Shape of the resolved translation payload for the admin maintenance settings page.
 */
export type AdminMaintenanceTranslations = BuildPayloadResult<typeof ADMIN_MAINTENANCE_MAPPING>;

/**
 * Builds the resolved translation payload for the admin maintenance settings page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The maintenance settings `t` object with every UI string resolved.
 */
export function buildAdminMaintenanceIndexPayload(i18n: I18nTranslator): AdminMaintenanceTranslations {
	return i18n.buildPayload(ADMIN_MAINTENANCE_MAPPING);
}
