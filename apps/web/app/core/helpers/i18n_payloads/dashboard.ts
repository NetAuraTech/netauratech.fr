import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the admin dashboard page (core sections only).
 * CMS-specific keys live in `app/cms/helpers/i18n_payloads/dashboard_cms.ts`.
 */
export const DASHBOARD_MAPPING = {
	title: 'admin.dashboard.title',
	cards: {
		users: 'identity.admin.users.value',
		files: 'file.admin.files.value',
		folders: 'file.admin.dashboard.cards.folders',
		no_role: 'identity.admin.dashboard.cards.no_role',
	},
	recent: {
		uploads: 'file.admin.dashboard.recent.uploads',
		empty: 'admin.dashboard.recent.empty',
	},
	view_all: 'admin.dashboard.view_all',
};

/**
 * Shape of the resolved translation payload for the admin dashboard page.
 */
export type AdminDashboardTranslations = BuildPayloadResult<typeof DASHBOARD_MAPPING>;

/**
 * Builds the resolved translation payload for the admin dashboard page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The dashboard `t` object with every UI string resolved.
 */
export function buildDashboardPayload(i18n: I18nTranslator): AdminDashboardTranslations {
	return i18n.buildPayload(DASHBOARD_MAPPING);
}
