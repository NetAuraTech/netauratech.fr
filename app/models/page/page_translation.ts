import { PageTranslationSchema } from '#database/schema'
import PageRevision from '#models/page/page_revision'
import { belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Page from '#models/page/page'
import type { PageContent, PageStatus, ResolvedPageContent } from '#types/page'

export default class PageTranslation extends PageTranslationSchema {
  declare content: PageContent

  @column()
  declare status: PageStatus

  @belongsTo(() => Page, { foreignKey: 'pageId' })
  declare page: BelongsTo<typeof Page>

  @hasMany(() => PageRevision, { foreignKey: 'pageTranslationId' })
  declare revisions: HasMany<typeof PageRevision>

  declare resolved_content: ResolvedPageContent

  /**
   * Snapshots the current content into a new revision and purges old
   * non-pinned revisions beyond the configured keep count.
   *
   * @param createdBy - ID of the user triggering the save
   * @param keepCount - Maximum number of non-pinned revisions to retain (default 10)
   */
  async saveRevision(createdBy: number, keepCount = 10): Promise<void> {
    const { PageRevisionRepository } = await import('#repositories/page/page_revision_repository')
    const repo = new PageRevisionRepository()

    await repo.create({
      pageTranslationId: this.id,
      content: this.content,
      keep: false,
      createdBy,
    })

    await repo.purgeOld(this.id, keepCount)
  }
}
