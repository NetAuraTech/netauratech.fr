import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { showPageValidator, updatePageValidator, publishPageValidator } from '#validators/page'
import PageTransformer from '#transformers/page_transformer'
import router from '@adonisjs/core/services/router'

@inject()
export default class PagesUpdateController {
  constructor(protected pageService: PageService) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    const allRoutes = router.toJSON().root
    const availableRoutes = allRoutes
      .filter((r) => {
        if (!r.methods.includes('GET')) return false
        if (!r.name) return false
        const isExcluded =
          r.name.startsWith('admin.') ||
          r.name.startsWith('api.') ||
          r.name.startsWith('auth.') ||
          r.name.startsWith('pages.show') ||
          r.name.startsWith('settings.')

        return !isExcluded
      })
      .map((r) => ({
        name: r.name,
        pattern: r.pattern,
        params: r.pattern.match(/:(\w+)/g)?.map((p) => p.replace(':', '')) || [],
      }))

    const availablePostRoutes = allRoutes
      .filter((r) => {
        if (!r.methods.includes('POST')) return false
        if (!r.name) return false
        const isExcluded =
          r.name.startsWith('admin.') ||
          r.name.startsWith('api.') ||
          r.name.startsWith('auth.') ||
          r.name.startsWith('subscribe') ||
          r.name.startsWith('unsubscribe') ||
          r.name.startsWith('pages.show') ||
          r.name.startsWith('settings.')

        return !isExcluded
      })
      .map((r) => ({
        name: r.name,
        pattern: r.pattern,
        params: r.pattern.match(/:(\w+)/g)?.map((p) => p.replace(':', '')) || [],
      }))

    const availablePages = await this.pageService.getAvailablePagesForLink()

    const { id } = await showPageValidator.validate(params)
    const page = await this.pageService.detail(id)

    return inertia.render('page/cms/edit', {
      page: PageTransformer.transform(page),
      availableRoutes,
      availablePages,
      availablePostRoutes,
    })
  }

  async execute(ctx: HttpContext) {
    const { params, request, response, auth, session, i18n } = ctx

    const { id } = await showPageValidator.validate(params)
    const payload = await updatePageValidator.validate(request.all())
    const user = auth.getUserOrFail()

    const { locale, ...data } = payload

    await this.pageService.update(id, locale, data, user.id)

    session.flash('success', i18n.t('page.saved'))

    return response.redirect().back()
  }

  async publish(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    const { id } = await showPageValidator.validate(params)
    const { locale } = await publishPageValidator.validate(request.all())

    await this.pageService.publish(id, locale)

    session.flash('success', i18n.t('page.published'))

    return response.redirect().back()
  }

  async unpublish(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    const { id } = await showPageValidator.validate(params)
    const { locale } = await publishPageValidator.validate(request.all())

    await this.pageService.unpublish(id, locale)

    session.flash('success', i18n.t('page.unpublished'))

    return response.redirect().back()
  }
}
