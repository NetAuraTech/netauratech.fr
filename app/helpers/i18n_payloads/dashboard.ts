import type { I18nService } from '#services/i18n_service'

/**
 * Builds the resolved translation payload for the admin dashboard page.
 *
 * @param i18n - The request-scoped {@link I18nService}.
 * @returns The dashboard `t` object with every UI string resolved.
 */
export function buildDashboardPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'admin.dashboard.title',
    cards: {
      users: 'admin.users.value',
      pages: 'page.admin.value',
      translations: 'page.admin.dashboard.cards.translations',
      files: 'admin.files.value',
      templates: 'template.admin.value',
      published_locales: 'page.admin.dashboard.cards.published_locales',
      folders: 'admin.dashboard.cards.folders',
      no_role: 'admin.dashboard.cards.no_role',
    },
    status: {
      draft: 'page.admin.status.draft',
      published: 'page.admin.status.published',
      archived: 'page.admin.status.archived',
    },
    recent: {
      published_pages: 'page.admin.dashboard.recent.published_pages',
      uploads: 'admin.dashboard.recent.uploads',
      empty: 'admin.dashboard.recent.empty',
    },
    view_all: 'admin.dashboard.view_all',
  })
}
