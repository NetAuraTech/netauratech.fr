import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { listPageValidator, showPageValidator } from '#validators/page'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import PageTransformer from '#transformers/page_transformer'

@inject()
export default class PagesController {
  constructor(protected pageService: PageService) {}

  async render(ctx: HttpContext) {
    const { inertia, request, i18n } = ctx

    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listPageValidator.validate(data)

    const pages = await this.pageService.list(payload, pagination)

    return inertia.render('page/cms/index', {
      pages: PageTransformer.paginate(pages.all(), pages.getMeta()),
      filters: payload,
      translations: {
        title: i18n.t('cms.pages.list.title'),
        action: i18n.t('cms.pages.list.action'),
        search: {
          value: i18n.t('cms.pages.search.value'),
          placeholder: i18n.t('cms.pages.search.placeholder'),
          filter: i18n.t('cms.pages.search.filter'),
        },
        status: {
          all: i18n.t('cms.pages.status.all'),
          draft: i18n.t('cms.pages.status.draft'),
          published: i18n.t('cms.pages.status.published'),
          archived: i18n.t('cms.pages.status.archived'),
          value: i18n.t('cms.pages.status.value'),
        },
        locale: {
          value: i18n.t('cms.pages.locale.value'),
          all: i18n.t('cms.pages.locale.all'),
        },
        page_title: i18n.t('cms.pages.form.title.value'),
        slug: i18n.t('cms.pages.form.slug.value'),
        empty: i18n.t('cms.pages.list.empty'),
        value: i18n.t('cms.pages.value'),
        value_one: i18n.t('cms.pages.value_one'),
        actions: {
          value: i18n.t('cms.pages.actions'),
          show: i18n.t('cms.pages.show.title', { title: '{title}' }),
          edit: i18n.t('cms.pages.edit.title', { title: '{title}' }),
          delete: {
            value: i18n.t('cms.pages.delete.title', { title: '{title}' }),
            confirm: i18n.t('cms.pages.delete.confirm'),
          },
        },
      },
    })
  }

  async destroy(ctx: HttpContext) {
    const { response, params, session, i18n } = ctx

    const payload = await showPageValidator.validate(params)

    await this.pageService.delete(payload.id)

    session.flash('success', i18n.t('page.deleted'))

    return response.redirect().toRoute('admin.pages.render')
  }

  /**
   * POST /admin/pages/:id/homepage
   * Flags this page as the global homepage.
   */
  async setHomepage(ctx: HttpContext) {
    const { params, response, auth } = ctx
    const user = auth.getUserOrFail()
    await this.pageService.setHomepage(Number(params.id), user.id)
    return response.redirect().toRoute('admin.pages_show.render', { id: params.id })
  }
}
