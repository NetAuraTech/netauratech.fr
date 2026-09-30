import type { BuildPayloadResult, I18nTranslator } from '#core/contracts/i18n_translator';

/**
 * The flat i18n key mapping for the hand-written front projects page.
 */
export const PROJECTS_MAPPING = {
	welcome: 'projects.welcome',
	tagline: 'projects.tagline',
};

/**
 * Shape of the resolved translation payload for the front projects page.
 */
export type ProjectsTranslations = BuildPayloadResult<typeof PROJECTS_MAPPING>;

/**
 * Builds the resolved translation payload for the hand-written front projects page.
 *
 * @param i18n - The request-scoped {@link I18nTranslator}.
 * @returns The projects page `t` object with every UI string resolved.
 */
export function buildProjectsPayload(i18n: I18nTranslator): ProjectsTranslations {
	return i18n.buildPayload(PROJECTS_MAPPING);
}
