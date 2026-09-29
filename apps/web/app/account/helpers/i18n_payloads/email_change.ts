import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the email change confirmation page.
 */
export const EMAIL_CHANGE_MAPPING = {
	title: 'account.email.change.title',
	sub_title: 'account.email.change.sub_title',
	submit: 'account.email.change.submit',
	cancel: 'account.email.change.cancel',
	token: 'account.email.change.token',
	info: {
		title: 'account.email.change.info.title',
		message: 'account.email.change.info.message',
	},
};

/**
 * Shape of the resolved translation payload for the email change confirmation page.
 */
export type EmailChangeTranslations = BuildPayloadResult<typeof EMAIL_CHANGE_MAPPING>;

/**
 * Builds the resolved translation payload for the email change confirmation page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The email change `t` object with every UI string resolved.
 */
export function buildEmailChangePayload(i18n: I18nTranslator): EmailChangeTranslations {
	return i18n.buildPayload(EMAIL_CHANGE_MAPPING);
}
