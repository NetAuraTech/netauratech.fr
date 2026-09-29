import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the preferences settings section.
 */
export const PREFERENCES_MAPPING = {
	header: {
		title: 'account.title',
		sub_title: 'account.sub_title',
		tabs: {
			profile: 'account.profile.value',
			account: 'account.account.value',
			preferences: 'account.preferences.value',
			admin: 'admin.value',
			logout: 'auth.session.logout.value',
		},
	},
	appearance: {
		title: 'account.preferences.appearance.title',
		sub_title: 'account.preferences.appearance.sub_title',
		value: 'account.preferences.appearance.value',
	},
	interface: {
		title: 'account.preferences.interface.title',
		sub_title: 'account.preferences.interface.sub_title',
		submit: 'account.preferences.interface.submit',
		locale: {
			english: 'account.preferences.interface.locale.english',
			french: 'account.preferences.interface.locale.french',
			value: 'account.preferences.interface.locale.value',
		},
	},
};

/**
 * Shape of the resolved translation payload for the preferences settings section.
 */
export type SettingsPreferencesTranslations = BuildPayloadResult<typeof PREFERENCES_MAPPING>;

/**
 * Builds the resolved translation payload for the preferences settings section.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The preferences `t` object with every UI string resolved.
 */
export function buildPreferencesPayload(i18n: I18nTranslator): SettingsPreferencesTranslations {
	return i18n.buildPayload(PREFERENCES_MAPPING);
}
