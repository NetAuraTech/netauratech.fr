import { inject } from '@adonisjs/core'
import { PageRepository } from '#repositories/page/page_repository'
import { PageTranslationRepository } from '#repositories/page/page_translation_repository'
import { PageRevisionRepository } from '#repositories/page/page_revision_repository'
import { LogService } from '#services/logging/log_service'
import { sanitizePageContent } from '#services/page/sanitize_content'
import type Page from '#models/page/page'
import type PageTranslation from '#models/page/page_translation'
import type { PageContent } from '#types/page'
import type { PaginationFilters } from '#types/pagination'
import { urlFor } from '@adonisjs/core/services/url_builder'

interface ListFilters {
  status?: 'draft' | 'published' | 'archived'
  locale?: string
  search?: string
}

@inject()
export class PageService {
  constructor(
    protected pageRepository: PageRepository,
    protected translationRepository: PageTranslationRepository,
    protected revisionRepository: PageRevisionRepository,
    protected logService: LogService
  ) {}

  /**
   * Returns a paginated list of pages with their translations preloaded.
   *
   * @param filters    - Optional status, locale, and full-text search filters
   * @param pagination - Page number and per-page count
   */
  async list(filters: ListFilters, pagination: PaginationFilters) {
    return this.pageRepository.list(filters, pagination)
  }

  /**
   * Returns a single page with all its translations preloaded.
   *
   * @param id - Page ID
   * @throws {ModelNotFoundException} When no page exists with the given ID
   */
  async detail(id: number): Promise<Page> {
    return this.pageRepository.findByIdOrFail(id)
  }

  /**
   * Finds a published page by its slug across all locales.
   * Returns `null` when no published translation matches the slug.
   *
   * @param slug - The URL slug to look up
   */
  async findBySlug(slug: string): Promise<Page | null> {
    return this.pageRepository.findBySlug(slug)
  }

  /**
   * Creates a new page with its initial translation in the default locale.
   *
   * All `rich_text` block content in the initial translation is sanitised
   * server-side via DOMPurify before being persisted.
   *
   * @param payload - Page metadata and initial translation data
   * @param userId  - ID of the authenticated user creating the page
   * @throws {Error} `E_SLUG_EXISTS` when the slug is already taken
   */
  async create(
    payload: {
      defaultLocale: string
      metaImageId?: number | null
      translation: {
        locale: string
        slug: string
        title: string
        content?: PageContent
        metaTitle?: string | null
        metaDescription?: string | null
      }
    },
    userId: number
  ): Promise<Page> {
    const slugExists = await this.translationRepository.slugExists(payload.translation.slug)
    if (slugExists) {
      throw Object.assign(new Error(`Slug "${payload.translation.slug}" is already taken`), {
        code: 'E_SLUG_EXISTS',
      })
    }

    const rawContent = payload.translation.content ?? { blocks: [] }
    const safeContent = sanitizePageContent(rawContent)

    const page = await this.pageRepository.create({
      defaultLocale: payload.defaultLocale,
      metaImageId: payload.metaImageId ?? null,
      createdBy: userId,
    })

    await this.translationRepository.create({
      pageId: page.id,
      locale: payload.translation.locale,
      slug: payload.translation.slug,
      title: payload.translation.title,
      content: safeContent,
      metaTitle: payload.translation.metaTitle ?? null,
      metaDescription: payload.translation.metaDescription ?? null,
      status: 'draft',
    })

    this.logService.logBusiness(
      'page.created',
      { userId },
      {
        pageId: page.id,
        slug: payload.translation.slug,
      }
    )

    return this.pageRepository.findByIdOrFail(page.id)
  }

  /**
   * Updates a page translation's content and metadata.
   *
   * A revision of the current state is saved before applying the update so
   * it can be restored if needed. All `rich_text` block HTML is sanitised
   * server-side via DOMPurify before being persisted.
   *
   * @param pageId  - Page ID
   * @param locale  - Locale of the translation to update
   * @param payload - Fields to update; only provided fields are changed
   * @param userId  - ID of the user performing the update
   * @throws {Error} `E_ROW_NOT_FOUND` when the translation locale is not found
   * @throws {Error} `E_SLUG_EXISTS` when the new slug conflicts with another record
   */
  async update(
    pageId: number,
    locale: string,
    payload: Partial<{
      slug: string
      title: string
      content: PageContent
      metaTitle: string | null
      metaDescription: string | null
      metaImageId: number | null
    }>,
    userId: number
  ): Promise<PageTranslation> {
    const translation = await this.translationRepository.findByPageAndLocale(pageId, locale)
    if (!translation) {
      throw Object.assign(new Error(`No translation for locale "${locale}" on page ${pageId}`), {
        code: 'E_ROW_NOT_FOUND',
      })
    }

    if (payload.slug && payload.slug !== translation.slug) {
      const slugExists = await this.translationRepository.slugExists(payload.slug, translation.id)
      if (slugExists) {
        throw Object.assign(new Error(`Slug "${payload.slug}" is already taken`), {
          code: 'E_SLUG_EXISTS',
        })
      }
    }

    // Sanitise rich_text HTML before saving a revision or persisting
    const safeContent = payload.content ? sanitizePageContent(payload.content) : undefined

    await translation.saveRevision(userId)

    const { metaImageId, content: raw, ...translationData } = payload

    if (metaImageId !== undefined) {
      const page = await this.pageRepository.findByIdOrFail(pageId)
      await this.pageRepository.update(page, { metaImageId })
    }

    this.logService.logBusiness('page.updated', { userId }, { pageId, locale })

    return this.translationRepository.update(translation, {
      ...translationData,
      ...(safeContent !== undefined && { content: safeContent }),
    })
  }

  /**
   * Publishes a translation by setting its status to `published`.
   *
   * @param pageId - Page ID
   * @param locale - Locale of the translation to publish
   * @throws {Error} `E_ROW_NOT_FOUND` when the translation is not found
   */
  async publish(pageId: number, locale: string): Promise<PageTranslation> {
    const translation = await this.translationRepository.findByPageAndLocale(pageId, locale)
    if (!translation) {
      throw Object.assign(new Error(`No translation for locale "${locale}" on page ${pageId}`), {
        code: 'E_ROW_NOT_FOUND',
      })
    }

    this.logService.logBusiness('page.published', {}, { pageId, locale })
    return this.translationRepository.update(translation, { status: 'published' })
  }

  /**
   * Unpublishes a translation back to `draft` status.
   *
   * @param pageId - Page ID
   * @param locale - Locale of the translation to unpublish
   * @throws {Error} `E_ROW_NOT_FOUND` when the translation is not found
   */
  async unpublish(pageId: number, locale: string): Promise<PageTranslation> {
    const translation = await this.translationRepository.findByPageAndLocale(pageId, locale)
    if (!translation) {
      throw Object.assign(new Error(`No translation for locale "${locale}" on page ${pageId}`), {
        code: 'E_ROW_NOT_FOUND',
      })
    }

    this.logService.logBusiness('page.unpublished', {}, { pageId, locale })
    return this.translationRepository.update(translation, { status: 'draft' })
  }

  /**
   * Permanently deletes a page and all its translations and revisions via cascade.
   *
   * @param pageId - Page ID
   * @throws {ModelNotFoundException} When no page exists with the given ID
   */
  async delete(pageId: number): Promise<void> {
    this.logService.logBusiness('page.deleted', {}, { pageId })
    return this.pageRepository.delete(pageId)
  }

  /**
   * Creates a new translation for an existing page.
   *
   * Content is optionally deep-copied from another locale (`seedFromLocale`).
   * The seeded content is sanitised before being stored.
   *
   * @param pageId          - Page ID
   * @param locale          - New locale code (e.g. `'fr'`)
   * @param payload         - Slug, title, and optional meta for the new translation
   * @param seedFromLocale  - Locale to copy content from; leave undefined for empty content
   * @throws {Error} `E_SLUG_EXISTS` when the slug is already taken
   */
  async createTranslation(
    pageId: number,
    locale: string,
    payload: {
      slug: string
      title: string
      metaTitle?: string | null
      metaDescription?: string | null
    },
    seedFromLocale?: string
  ): Promise<PageTranslation> {
    const slugExists = await this.translationRepository.slugExists(payload.slug)
    if (slugExists) {
      throw Object.assign(new Error(`Slug "${payload.slug}" is already taken`), {
        code: 'E_SLUG_EXISTS',
      })
    }

    let content: PageContent = { blocks: [] }

    if (seedFromLocale) {
      const source = await this.translationRepository.findByPageAndLocale(pageId, seedFromLocale)
      if (source) {
        content = sanitizePageContent(JSON.parse(JSON.stringify(source.content)))
      }
    }

    return this.translationRepository.create({
      pageId,
      locale,
      slug: payload.slug,
      title: payload.title,
      content,
      metaTitle: payload.metaTitle ?? null,
      metaDescription: payload.metaDescription ?? null,
      status: 'draft',
    })
  }

  /**
   * Restores a previous revision as the current content of a translation.
   * A revision of the current state is saved before restoring so the
   * operation is reversible.
   *
   * @param translationId - Translation ID
   * @param revisionId    - Revision ID to restore
   * @param userId        - ID of the user performing the restore
   * @throws {ModelNotFoundException} When the translation or revision is not found
   */
  async restoreRevision(
    translationId: number,
    revisionId: number,
    userId: number
  ): Promise<PageTranslation> {
    const { default: PageTranslation } = await import('#models/page/page_translation')
    const translation = await PageTranslation.findOrFail(translationId)

    await translation.saveRevision(userId)

    const revision = await this.revisionRepository.findByIdOrFail(revisionId)

    this.logService.logBusiness(
      'page.revision.restored',
      { userId },
      {
        translationId,
        revisionId,
      }
    )

    return this.translationRepository.update(translation, { content: revision.content })
  }

  /**
   * Lists all revisions for a translation, ordered from newest to oldest.
   *
   * @param translationId - Translation ID
   */
  async listRevisions(translationId: number) {
    return this.revisionRepository.listByTranslation(translationId)
  }

  /**
   * Toggles the `keep` flag on a revision.
   * Pinned revisions (`keep = true`) are excluded from the auto-purge cycle.
   *
   * @param revisionId - Revision ID
   * @throws {ModelNotFoundException} When no revision exists with the given ID
   */
  async toggleRevisionKeep(revisionId: number) {
    return this.revisionRepository.toggleKeep(revisionId)
  }

  /**
   * Returns the current homepage page, or null.
   */
  async findHomepage(): Promise<Page | null> {
    return this.pageRepository.findHomepage()
  }

  /**
   * Sets the given page as the global homepage.
   * Logs a business event for auditability.
   */
  async setHomepage(pageId: number, userId: number): Promise<void> {
    await this.pageRepository.setHomepage(pageId)
    this.logService.logBusiness('page.homepage.set', { pageId, userId })
  }

  async getAvailablePagesForLink() {
    const pages = await this.pageRepository.listForLinks()

    return pages.map((page) => ({
      id: page.id,
      label: page.translations[0]?.title,
      default_locale: page.defaultLocale,
      locales: page.translations.map((t) => ({ locale: t.locale, slug: t.slug })),
    }))
  }

  /**
   * Generates an XML sitemap for search engine indexing.
   * Only includes published translations.
   */
  async generateSitemap(): Promise<string> {
    const pages = await this.pageRepository.listPublishedForSitemap()
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
    const appUrl = process.env.APP_URL

    pages.forEach((page) => {
      page.translations.forEach((t) => {
        let url: string

        if (page.isHomepage) {
          url = t.locale === page.defaultLocale ? `${appUrl}/` : `${appUrl}/${t.locale}/`
        } else {
          url =
            t.locale === page.defaultLocale
              ? `${appUrl}${urlFor('page.render', { slug: t.slug })}`
              : `${appUrl}${urlFor('page.localised.render', { locale: t.locale, slug: t.slug })}`
        }

        xml += `\n  <url>
                      <loc>${url}</loc>
                      <lastmod>${t.updatedAt?.toISODate()}</lastmod>
                      <priority>${page.isHomepage ? '1.0' : '0.8'}</priority>
                    </url>`
      })
    })

    return xml + `\n</urlset>`
  }

  /**
   * Returns a basic robots.txt file content.
   */
  getRobotsTxt(): string {
    const appUrl = process.env.APP_URL

    return [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/*',
      'Disallow: /settings/*',
      '',
      `Sitemap: ${appUrl}${urlFor('page.sitemap')}`,
    ].join('\n')
  }
}
