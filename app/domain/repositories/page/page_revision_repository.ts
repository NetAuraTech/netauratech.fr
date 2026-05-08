import PageRevision from '#models/page/page_revision'
import type { PageContent } from '#types/page'

export class PageRevisionRepository {
  async findById(id: number): Promise<PageRevision | null> {
    return PageRevision.find(id)
  }

  async findByIdOrFail(id: number): Promise<PageRevision> {
    return PageRevision.findOrFail(id)
  }

  async listByTranslation(translationId: number, limit?: number): Promise<PageRevision[]> {
    const query = PageRevision.query()
      .preload('author')
      .where('page_translation_id', translationId)
      .orderBy('created_at', 'desc')

    if (limit) query.limit(limit)

    return query
  }

  async create(data: {
    pageTranslationId: number
    content: PageContent
    keep: boolean
    createdBy: number | null
  }): Promise<PageRevision> {
    return PageRevision.create(data)
  }

  async toggleKeep(id: number): Promise<PageRevision> {
    const revision = await PageRevision.findOrFail(id)
    revision.keep = !revision.keep
    await revision.save()
    return revision
  }

  /**
   * Deletes the oldest non-pinned revisions for a translation beyond `keepCount`.
   * Pinned revisions (`keep = true`) are never touched.
   *
   * @param translationId - The translation to purge revisions for
   * @param keepCount - Maximum number of non-pinned revisions to retain
   */
  async purgeOld(translationId: number, keepCount: number): Promise<void> {
    const unpinned = await PageRevision.query()
      .where('page_translation_id', translationId)
      .where('keep', false)
      .orderBy('created_at', 'desc')

    if (unpinned.length <= keepCount) return

    const toDelete = unpinned.slice(keepCount).map((r) => r.id)

    await PageRevision.query().whereIn('id', toDelete).delete()
  }
}
