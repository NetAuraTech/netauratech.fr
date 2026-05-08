import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { PageService } from '#services/page/page_service'
import { showPageValidator, createTranslationValidator } from '#validators/page'

@inject()
export default class PageTranslationsController {
  constructor(protected pageService: PageService) {}

  async execute(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    const { id } = await showPageValidator.validate(params)
    const payload = await createTranslationValidator.validate(request.all())

    const { locale, seedFromLocale, ...translationData } = payload

    await this.pageService.createTranslation(id, locale, translationData, seedFromLocale)

    session.flash('success', i18n.t('page.translation.created', { locale }))

    return response.redirect().back()
  }
}
