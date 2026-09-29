import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the login-time 2FA challenge page.
 */
export const TWO_FACTOR_MAPPING = {
	title: 'auth.session.two_factor.title',
	sub_title: 'auth.session.two_factor.sub_title',
	code: {
		value: 'auth.session.two_factor.code.value',
		placeholder: 'auth.session.two_factor.code.placeholder',
	},
	apps: 'auth.session.two_factor.apps',
	submit: 'auth.session.two_factor.submit',
	back_to_login: 'auth.session.two_factor.back_to_login',
};

/**
 * Shape of the resolved translation payload for the 2FA challenge page.
 */
export type TwoFactorTranslations = BuildPayloadResult<typeof TWO_FACTOR_MAPPING>;

/**
 * Builds the translation payload for the 2FA challenge page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The challenge `t` object with every UI string resolved.
 */
export function buildTwoFactorPayload(i18n: I18nTranslator): TwoFactorTranslations {
	return i18n.buildPayload(TWO_FACTOR_MAPPING);
}
