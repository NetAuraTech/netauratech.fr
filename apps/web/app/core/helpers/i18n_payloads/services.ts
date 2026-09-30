import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the hand-written front services page.
 */
export const SERVICES_MAPPING = {
	welcome: 'services.welcome',
	tagline: 'services.tagline',
};

/**
 * Shape of the resolved translation payload for the front services page.
 */
export type ServicesTranslations = BuildPayloadResult<typeof SERVICES_MAPPING>;

/**
 * Builds the resolved translation payload for the hand-written front services page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The services page `t` object with every UI string resolved.
 */
export function buildServicesPayload(i18n: I18nTranslator): ServicesTranslations {
	return i18n.buildPayload(SERVICES_MAPPING);
}
