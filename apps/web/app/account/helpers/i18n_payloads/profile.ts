import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the profile settings section.
 */
export const PROFILE_MAPPING = {
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
	avatar: {
		change: 'account.profile.avatar.change',
		value: 'account.profile.avatar.value',
	},
	username: {
		placeholder: 'account.profile.username.placeholder',
		value: 'account.profile.username.value',
	},
	title: 'account.profile.title',
	sub_title: 'account.profile.sub_title',
	submit: 'account.profile.submit',
};

/**
 * Shape of the resolved translation payload for the profile settings section.
 */
export type SettingsProfileTranslations = BuildPayloadResult<typeof PROFILE_MAPPING>;

/**
 * Builds the resolved translation payload for the profile settings section.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The profile `t` object with every UI string resolved.
 */
export function buildProfilePayload(i18n: I18nTranslator): SettingsProfileTranslations {
	return i18n.buildPayload(PROFILE_MAPPING);
}
