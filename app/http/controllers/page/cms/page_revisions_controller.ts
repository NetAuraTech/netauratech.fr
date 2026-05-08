import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { revisionValidator } from '#validators/page'
import vine from '@vinejs/vine'
import PageRevisionTransformer from '#transformers/page_revision_transformer'

const translationIdValidator = vine.compile(
  vine.object({ translationId: vine.number().positive() })
)

@inject()
export default class PageRevisionsController {
  constructor(protected pageService: PageService) {}

  async index(ctx: HttpContext) {
    const { inertia, params, i18n } = ctx

    const { translationId } = await translationIdValidator.validate(params)
    const revisions = await this.pageService.listRevisions(translationId)

    return inertia.render('page/cms/revisions', {
      revisions: PageRevisionTransformer.transform(revisions),
      translation_id: translationId,
      page_id: params.id,
      translations: {
        title: i18n.t('cms.pages.show.revision.value'),
        actions: {
          value: i18n.t('cms.pages.actions'),
          back: i18n.t('cms.pages.show.revision.back'),
          restore: {
            value: i18n.t('cms.pages.show.revision.restore.value'),
            confirm: i18n.t('cms.pages.show.revision.restore.confirm'),
          },
          unpin: i18n.t('cms.pages.show.revision.unpin'),
          pin: i18n.t('cms.pages.show.revision.pin'),
        },
        help: i18n.t('cms.pages.show.revision.help'),
        index: i18n.t('cms.pages.show.revision.index'),
        created: {
          at: i18n.t('cms.pages.show.revision.created.at'),
          by: i18n.t('cms.pages.show.revision.created.by'),
        },
        empty: {
          value: i18n.t('cms.pages.show.revision.empty.value'),
          help: i18n.t('cms.pages.show.revision.empty.help'),
        },
        latest: i18n.t('cms.pages.show.revision.latest'),
      },
    })
  }

  async restore(ctx: HttpContext) {
    const { params, response, auth, session, i18n } = ctx

    const payload = await revisionValidator.validate(params)
    const user = auth.getUserOrFail()

    await this.pageService.restoreRevision(payload.translationId, payload.revisionId, user.id)

    session.flash('success', i18n.t('page.revision.restored'))

    return response.redirect().back()
  }

  async toggleKeep(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    const payload = await revisionValidator.validate(params)

    const revision = await this.pageService.toggleRevisionKeep(payload.revisionId)

    session.flash(
      'success',
      revision.keep ? i18n.t('page.revision.pinned') : i18n.t('page.revision.unpinned')
    )

    return response.redirect().back()
  }
}
