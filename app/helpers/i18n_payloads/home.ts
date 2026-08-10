import type { I18nService } from '#services/i18n_service'

/**
 * Builds the resolved translation payload for the hand-written front home page.
 *
 * @param i18n - The request-scoped {@link I18nService}.
 * @returns The home page `t` object with every UI string resolved.
 */
export function buildHomePayload(i18n: I18nService) {
  return i18n.buildPayload({
    welcome: 'home.welcome',
    tagline: 'home.tagline',
  })
}
