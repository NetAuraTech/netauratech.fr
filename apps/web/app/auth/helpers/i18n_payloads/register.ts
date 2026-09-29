import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the registration page.
 */
export const REGISTER_MAPPING = {
	title: 'auth.register.title',
	sub_title: 'auth.register.sub_title',
	account: {
		has: 'auth.register.account.has',
		login: 'auth.register.account.login',
	},
	email: {
		value: 'auth.register.email.value',
		placeholder: 'auth.register.email.placeholder',
	},
	password: {
		value: 'auth.register.password.value',
		help: 'auth.register.password.help',
		confirmation: {
			value: 'auth.register.password.confirmation.value',
			help: 'auth.register.password.confirmation.help',
		},
	},
	submit: 'auth.register.submit',
	or_continue_with: 'auth.register.or_continue_with',
};

/**
 * Shape of the resolved translation payload for the registration page.
 */
export type RegisterTranslations = BuildPayloadResult<typeof REGISTER_MAPPING>;

/**
 * Builds the resolved translation payload for the registration page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The registration `t` object with every UI string resolved.
 */
export function buildRegisterPayload(i18n: I18nTranslator): RegisterTranslations {
	return i18n.buildPayload(REGISTER_MAPPING);
}
