import Page from '#models/page/page'
import type { PaginationFilters } from '#types/pagination'
import type { PageStatus } from '#types/page'

interface ListFilters {
  status?: PageStatus
  locale?: string
  search?: string
}

export class PageRepository {
  async findById(id: number): Promise<Page | null> {
    return Page.query().where('id', id).preload('translations').preload('metaImage').first()
  }

  async findByIdOrFail(id: number): Promise<Page> {
    return Page.query().where('id', id).preload('translations').preload('metaImage').firstOrFail()
  }

  /**
   * Finds a published page by its slug across all locales.
   * The locale is derived from the matching translation's locale field.
   */
  async findBySlug(slug: string): Promise<Page | null> {
    return Page.query()
      .whereHas('translations', (t) => {
        t.where('slug', slug).where('status', 'published')
      })
      .preload('translations', (t) => t.preload('revisions', (r) => r.limit(0)))
      .preload('metaImage', (m) => m.preload('alts'))
      .first()
  }

  /**
   * Returns the page flagged as homepage, or null if none is set.
   */
  async findHomepage(): Promise<Page | null> {
    return Page.query().where('is_homepage', true).preload('translations').first()
  }

  async list(filters: ListFilters, pagination: PaginationFilters) {
    const query = Page.query().preload('translations').orderBy('created_at', 'desc')

    if (filters.status) {
      query.whereHas('translations', (t) => t.where('status', filters.status!))
    }

    if (filters.locale) {
      query.whereHas('translations', (t) => t.where('locale', filters.locale!))
    }

    if (filters.search) {
      query.whereHas('translations', (t) => {
        t.whereILike('title', `%${filters.search}%`).orWhereILike('slug', `%${filters.search}%`)
      })
    }

    return query.paginate(pagination.page ?? 1, pagination.perPage ?? 20)
  }

  async create(data: {
    defaultLocale: string
    createdBy: number
    metaImageId?: number | null
  }): Promise<Page> {
    return Page.create(data)
  }

  async update(
    page: Page,
    data: Partial<{
      defaultLocale: string
      metaImageId: number | null
    }>
  ): Promise<Page> {
    page.merge(data)
    await page.save()
    return page
  }

  /**
   * Sets `pageId` as the homepage, clearing the flag on any previous homepage.
   * Runs in a transaction to avoid a race condition between the clear and the set.
   */
  async setHomepage(pageId: number): Promise<void> {
    await Page.query().where('is_homepage', true).update({ isHomepage: false })
    await Page.query().where('id', pageId).update({ isHomepage: true })
  }

  async delete(id: number): Promise<void> {
    const page = await Page.findOrFail(id)
    await page.delete()
  }

  async listForLinks() {
    return Page.query()
      .select('id', 'default_locale')
      .preload('translations', (q) => q.select('title', 'locale', 'slug'))
      .orderBy('id', 'asc')
  }

  /**
   * Retrieves all pages that have at least one published translation.
   * Specifically used for XML Sitemap generation.
   */
  async listPublishedForSitemap() {
    return Page.query()
      .whereHas('translations', (query) => {
        query.where('status', 'published')
      })
      .preload('translations', (query) => {
        query.where('status', 'published')
      })
  }
}
