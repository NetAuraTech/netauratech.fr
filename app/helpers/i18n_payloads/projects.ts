import type { I18nService } from '#services/i18n_service'

/**
 * Builds the resolved translation payload for the hand-written front projects page.
 *
 * @param i18n - The request-scoped {@link I18nService}.
 * @returns The projects page `t` object with every UI string resolved.
 */
export function buildProjectsPayload(i18n: I18nService) {
  return i18n.buildPayload({
    welcome: 'projects.welcome',
    tagline: 'projects.tagline',
  })
}
