import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the reset password page.
 */
export const RESET_PASSWORD_MAPPING = {
	title: 'auth.password.reset.title',
	sub_title: 'auth.password.reset.sub_title',
	password: {
		value: 'auth.password.reset.password.value',
		help: 'auth.password.reset.password.help',
		confirmation: {
			value: 'auth.password.reset.password.confirmation.value',
			help: 'auth.password.reset.password.confirmation.help',
		},
	},
	submit: 'auth.password.reset.submit',
	back_to_login: 'auth.password.reset.back_to_login',
};

/**
 * Shape of the resolved translation payload for the reset password page.
 */
export type ResetPasswordTranslations = BuildPayloadResult<typeof RESET_PASSWORD_MAPPING>;

/**
 * Builds the resolved translation payload for the reset password page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The reset password `t` object with every UI string resolved.
 */
export function buildResetPasswordPayload(i18n: I18nTranslator): ResetPasswordTranslations {
	return i18n.buildPayload(RESET_PASSWORD_MAPPING);
}
