import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the login page.
 */
export const SESSION_MAPPING = {
	title: 'auth.session.login.title',
	sub_title: 'auth.session.login.sub_title',
	account: {
		no: 'auth.session.login.account.no',
		create: 'auth.session.login.account.create',
	},
	email: {
		value: 'auth.session.login.email.value',
		placeholder: 'auth.session.login.email.placeholder',
	},
	password: {
		value: 'auth.session.login.password.value',
		forgot: 'auth.session.login.password.forgot',
	},
	remember_me: 'auth.session.login.remember_me',
	submit: 'auth.session.login.submit',
	or_continue_with: 'auth.session.login.or_continue_with',
};

/**
 * Shape of the resolved translation payload for the login page.
 */
export type LoginTranslations = BuildPayloadResult<typeof SESSION_MAPPING>;

/**
 * Builds the translation payload for the login page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The login `t` object with every UI string resolved.
 */
export function buildSessionPayload(i18n: I18nTranslator): LoginTranslations {
	return i18n.buildPayload(SESSION_MAPPING);
}
