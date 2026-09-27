import type { I18nService } from '#services/i18n_service'

/**
 * Builds the resolved translation payload for the hand-written front services page.
 *
 * @param i18n - The request-scoped {@link I18nService}.
 * @returns The services page `t` object with every UI string resolved.
 */
export function buildServicesPayload(i18n: I18nService) {
  return i18n.buildPayload({
    welcome: 'services.welcome',
    tagline: 'services.tagline',
  })
}
