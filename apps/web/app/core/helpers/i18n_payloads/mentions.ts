import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the hand-written front legal notices page.
 */
export const MENTIONS_MAPPING = {
	title: 'mentions.title',
	lede: 'mentions.lede',
};

/**
 * Shape of the resolved translation payload for the front legal notices page.
 */
export type MentionsTranslations = BuildPayloadResult<typeof MENTIONS_MAPPING>;

/**
 * Builds the resolved translation payload for the hand-written front legal notices page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The legal notices page `t` object with every UI string resolved.
 */
export function buildMentionsPayload(i18n: I18nTranslator): MentionsTranslations {
	return i18n.buildPayload(MENTIONS_MAPPING);
}
