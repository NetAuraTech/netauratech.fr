import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { createPageValidator } from '#validators/page'

@inject()
export default class PagesCreateController {
  constructor(protected pageService: PageService) {}

  async render(ctx: HttpContext) {
    const { inertia, i18n } = ctx

    return inertia.render('page/cms/create', {
      translations: {
        title: i18n.t('cms.pages.create.title'),
        action: i18n.t('cms.pages.list.title'),
        details: i18n.t('cms.pages.create.details.value'),
        locale: i18n.t('cms.pages.form.locale.default'),
        slug: i18n.t('cms.pages.form.slug.value'),
        page_title: {
          value: i18n.t('cms.pages.form.title.value'),
          placeholder: i18n.t('cms.pages.form.title.placeholder'),
        },
        seo: {
          value: i18n.t('cms.pages.create.seo.value'),
          help: i18n.t('cms.pages.create.seo.help', { title: '{title}' }),
        },
        meta: {
          title: {
            value: i18n.t('cms.pages.form.meta.title.value'),
            placeholder: i18n.t('cms.pages.form.meta.title.placeholder'),
          },
          description: {
            value: i18n.t('cms.pages.form.meta.description.value'),
            placeholder: i18n.t('cms.pages.form.meta.description.placeholder'),
          },
        },
        submit: i18n.t('cms.pages.form.submit'),
      },
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, auth, session, i18n } = ctx

    const data = await createPageValidator.validate(request.all())
    const user = auth.getUserOrFail()

    const payload = {
      defaultLocale: data.locale,
      metaImageId: data.metaImageId,
      translation: {
        locale: data.locale,
        slug: data.slug,
        title: data.title,
        content: data.content,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
    }

    const page = await this.pageService.create(payload, user.id)

    session.flash('success', i18n.t('page.created'))

    return response.redirect().toRoute('admin.pages_update.render', { id: page.id })
  }
}
