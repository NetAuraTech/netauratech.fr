import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { SiteContentService } from '#services/core/site_content_service'
import { FindFileAction } from '#actions/file/find_file_action'
import { resolveProjectCovers } from '#services/core/project_covers'
import { buildProjectsPayload } from '#helpers/i18n_payloads/projects'

/**
 * Serves the hand-written projects page of the public front.
 *
 * The projects page is content-driven: every entry comes from the committed
 * markdown sources in `content/projects/`, parsed by {@link SiteContentService}
 * into the JSON payload the Inertia page consumes. Project covers are resolved
 * server-side against the backend file module.
 */
@inject()
export default class ProjectsController {
  constructor(
    protected i18n: I18nService,
    protected siteContent: SiteContentService,
    protected findFile: FindFileAction
  ) {}

  /**
   * `GET /projets` — renders the projects page as `front.projects` with the
   * project portfolio, the resolved covers and the translated labels.
   *
   * @returns The Inertia-rendered `core/front/projects` page.
   */
  async render({ inertia }: HttpContext) {
    const projects = await this.siteContent.getProjects()

    return inertia.render('core/front/projects', {
      translations: buildProjectsPayload(this.i18n),
      projects: await resolveProjectCovers(projects, this.findFile),
    })
  }
}
