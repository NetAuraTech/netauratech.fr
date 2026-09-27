import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { SiteContentService } from '#services/core/site_content_service'
import { FindFileAction } from '#actions/file/find_file_action'
import { resolveProjectCovers } from '#services/core/project_covers'
import { buildHomePayload } from '#helpers/i18n_payloads/home'

/**
 * Serves the hand-written home page of the public front.
 *
 * The home page is content-driven: services and projects come from the
 * committed markdown sources in `content/`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes. Project covers are resolved
 * server-side against the backend file module.
 */
@inject()
export default class HomeController {
  constructor(
    protected i18n: I18nService,
    protected siteContent: SiteContentService,
    protected findFile: FindFileAction
  ) {}

  /**
   * `GET /` — renders the home page as `front.home` with the content
   * catalogue, the resolved project covers and the translated labels.
   *
   * @returns The Inertia-rendered `core/front/home` page.
   */
  async render({ inertia }: HttpContext) {
    const content = await this.siteContent.getHomeContent()

    return inertia.render('core/front/home', {
      translations: buildHomePayload(this.i18n),
      services: content.services,
      projects: await resolveProjectCovers(content.projects, this.findFile),
    })
  }
}
