import PageTranslation from '#models/page/page_translation'
import type { PageContent, PageStatus } from '#types/page'

export class PageTranslationRepository {
  async findById(id: number): Promise<PageTranslation | null> {
    return PageTranslation.find(id)
  }

  async findByPageAndLocale(pageId: number, locale: string): Promise<PageTranslation | null> {
    return PageTranslation.query().where('page_id', pageId).where('locale', locale).first()
  }

  async findBySlug(slug: string): Promise<PageTranslation | null> {
    return PageTranslation.query().where('slug', slug).first()
  }

  async create(data: {
    pageId: number
    locale: string
    slug: string
    title: string
    content: PageContent
    metaTitle?: string | null
    metaDescription?: string | null
    status?: PageStatus
  }): Promise<PageTranslation> {
    return PageTranslation.create({
      ...data,
      status: data.status ?? 'draft',
    })
  }

  async update(
    translation: PageTranslation,
    data: Partial<{
      slug: string
      title: string
      content: PageContent
      metaTitle: string | null
      metaDescription: string | null
      status: PageStatus
    }>
  ): Promise<PageTranslation> {
    translation.merge(data)
    await translation.save()
    return translation
  }

  /**
   * Creates or updates the translation for a given page + locale.
   * Used when copying a page to a new locale.
   */
  async upsert(
    pageId: number,
    locale: string,
    data: {
      slug: string
      title: string
      content: PageContent
      metaTitle?: string | null
      metaDescription?: string | null
      status?: PageStatus
    }
  ): Promise<PageTranslation> {
    return PageTranslation.updateOrCreate(
      { pageId, locale },
      {
        ...data,
        status: data.status ?? 'draft',
      }
    )
  }

  async slugExists(slug: string, excludeId?: number): Promise<boolean> {
    const query = PageTranslation.query().where('slug', slug)
    if (excludeId) query.whereNot('id', excludeId)
    const result = await query.first()
    return !!result
  }
}
