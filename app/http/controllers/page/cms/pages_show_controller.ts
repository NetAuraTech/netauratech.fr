import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { showPageValidator } from '#validators/page'
import PageTransformer from '#transformers/page_transformer'

@inject()
export default class PagesShowController {
  constructor(protected pageService: PageService) {}

  async render(ctx: HttpContext) {
    const { inertia, params, i18n } = ctx

    const { id } = await showPageValidator.validate(params)
    const page = await this.pageService.detail(id)

    return inertia.render('page/cms/show', {
      page: PageTransformer.transform(page),
      translations: {
        title: i18n.t('cms.pages.show.title', { title: '{title}' }),
        actions: {
          back: i18n.t('cms.pages.list.title'),
          edit: i18n.t('cms.pages.edit.title', { title: '{title}' }),
          show: i18n.t('cms.pages.show.title', { title: '{title}' }),
          delete: {
            confirm: i18n.t('cms.pages.delete.title', { title: '{title}' }),
            value: i18n.t('cms.pages.delete.title', { title: '{title}' }),
          },
        },
        status: {
          draft: i18n.t('cms.pages.status.draft'),
          published: i18n.t('cms.pages.status.published'),
          archived: i18n.t('cms.pages.status.archived'),
        },
        meta: {
          value: i18n.t('cms.pages.show.meta.value'),
          title: i18n.t('cms.pages.show.meta.title'),
          id: i18n.t('cms.pages.show.meta.id'),
          locale: i18n.t('cms.pages.show.meta.locale'),
          translations: i18n.t('cms.pages.show.meta.translations'),
          created: i18n.t('cms.pages.show.meta.created'),
          updated: i18n.t('cms.pages.show.meta.updated'),
        },
        revision: {
          value: i18n.t('cms.pages.show.revision.value'),
          view: i18n.t('cms.pages.show.revision.view'),
        },
        homepage: {
          value: i18n.t('cms.pages.show.homepage.value'),
          confirm: i18n.t('cms.pages.show.homepage.confirm'),
          submit: i18n.t('cms.pages.show.homepage.submit'),
          help: {
            title: {
              not_set: i18n.t('cms.pages.show.homepage.help.title.not_set'),
              set: i18n.t('cms.pages.show.homepage.help.title.set'),
            },
            message: {
              not_set: i18n.t('cms.pages.show.homepage.help.message.not_set'),
              set: i18n.t('cms.pages.show.homepage.help.message.set'),
            },
          },
        },
        last_update: i18n.t('cms.pages.show.last_update'),
        translation: i18n.t('cms.pages.show.translation', { count: '{count}' }),
        default: i18n.t('cms.pages.show.default'),
      },
    })
  }
}
