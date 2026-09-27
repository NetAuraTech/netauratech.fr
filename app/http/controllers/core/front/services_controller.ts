import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { SiteContentService } from '#services/core/site_content_service'
import { buildServicesPayload } from '#helpers/i18n_payloads/services'

/**
 * Serves the hand-written services page of the public front.
 *
 * The services page is content-driven: every offer comes from the committed
 * markdown sources in `content/services/`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes.
 */
@inject()
export default class ServicesController {
  constructor(
    protected i18n: I18nService,
    protected siteContent: SiteContentService
  ) {}

  /**
   * `GET /services` — renders the services page as `front.services` with the
   * service catalogue and the resolved translations.
   *
   * @returns The Inertia-rendered `core/front/services` page.
   */
  async render({ inertia }: HttpContext) {
    const services = await this.siteContent.getServices()

    return inertia.render('core/front/services', {
      translations: buildServicesPayload(this.i18n),
      services,
    })
  }
}
