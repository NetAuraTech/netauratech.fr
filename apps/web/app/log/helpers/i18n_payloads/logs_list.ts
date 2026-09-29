import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin logs listing page.
 */
export const LOGS_MAPPING = {
	title: 'log.admin.list.title',
	empty: 'log.admin.list.empty',
	logged_on: 'log.admin.list.logged_on',
	search: {
		value: 'log.admin.search.value',
		placeholder: 'log.admin.search.placeholder',
		filter: 'log.admin.search.filter',
	},
	level: {
		value: 'log.admin.level.value',
		placeholder: 'log.admin.level.placeholder',
		debug: 'log.admin.level.debug',
		info: 'log.admin.level.info',
		warn: 'log.admin.level.warn',
		error: 'log.admin.level.error',
		fatal: 'log.admin.level.fatal',
	},
	category: {
		value: 'log.admin.category.value',
		placeholder: 'log.admin.category.placeholder',
		system: 'log.admin.category.system',
		security: 'log.admin.category.security',
		business: 'log.admin.category.business',
		auth: 'log.admin.category.auth',
		api: 'log.admin.category.api',
		database: 'log.admin.category.database',
		performance: 'log.admin.category.performance',
	},
	date: {
		from: 'log.admin.date.from',
		to: 'log.admin.date.to',
	},
	context: {
		value: 'log.admin.context.value',
		empty: 'log.admin.context.empty',
		view: 'log.admin.context.view',
	},
	columns: {
		level: 'log.admin.columns.level',
		category: 'log.admin.columns.category',
		message: 'log.admin.columns.message',
		actor: 'log.admin.columns.actor',
		date: 'log.admin.columns.date',
	},
};

/**
 * Shape of the resolved translation payload for the admin logs listing page.
 */
export type AdminLogsIndexTranslations = BuildPayloadResult<typeof LOGS_MAPPING>;

/**
 * Builds the resolved translation payload for the admin logs listing page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The logs listing `t` object with every UI string resolved.
 */
export function buildLogsListPayload(i18n: I18nTranslator): AdminLogsIndexTranslations {
	return i18n.buildPayload(LOGS_MAPPING);
}
