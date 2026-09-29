import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the social provider define-password page.
 */
export const SOCIAL_DEFINE_PASSWORD_MAPPING = {
	title: 'auth.password.define.title',
	sub_title: 'auth.password.define.sub_title',
	password: {
		value: 'auth.password.define.password.value',
		help: 'auth.password.define.password.help',
		confirmation: {
			value: 'auth.password.define.password.confirmation.value',
			help: 'auth.password.define.password.confirmation.help',
		},
	},
	submit: 'auth.password.define.submit',
};

/**
 * Shape of the resolved translation payload for the define-password page.
 */
export type DefinePasswordTranslations = BuildPayloadResult<typeof SOCIAL_DEFINE_PASSWORD_MAPPING>;

/**
 * Builds the translation payload for the social provider define-password page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The define-password `t` object with every UI string resolved.
 */
export function buildSocialDefinePasswordPayload(i18n: I18nTranslator): DefinePasswordTranslations {
	return i18n.buildPayload(SOCIAL_DEFINE_PASSWORD_MAPPING);
}
