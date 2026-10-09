import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the hand-written front privacy policy page.
 */
export const PRIVACY_MAPPING = {
	title: 'privacy.title',
	lede: 'privacy.lede',
	updated: 'privacy.updated',
};

/**
 * Shape of the resolved translation payload for the front privacy policy page.
 */
export type PrivacyTranslations = BuildPayloadResult<typeof PRIVACY_MAPPING>;

/**
 * Builds the resolved translation payload for the hand-written front privacy policy page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The privacy policy page `t` object with every UI string resolved.
 */
export function buildPrivacyPayload(i18n: I18nTranslator): PrivacyTranslations {
	return i18n.buildPayload(PRIVACY_MAPPING);
}
