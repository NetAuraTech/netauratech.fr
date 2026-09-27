import { inject } from '@adonisjs/core'
import env from '#start/env'
import { SiteContentService } from '#services/core/site_content_service'
import type { SitemapContributor } from '#types/sitemap'

/**
 * Sitemap contributor enumerating the hand-written single project pages.
 *
 * The single pages are served by the parameterised `front.projects.show`
 * route (`/projets/:slug`), which the route collector skips by construction —
 * so this contributor resolves the project catalogue and lists one URL per
 * committed source in `content/projects/`.
 */
@inject()
export class ProjectSitemapCollector implements SitemapContributor {
  readonly name = 'projects'

  constructor(protected siteContent: SiteContentService) {}

  /**
   * Enumerate every project single page as an absolute URL.
   *
   * @returns Absolute URLs for `/projets/{slug}`.
   */
  async collect(): Promise<string[]> {
    const baseUrl = env.get('APP_URL')
    const projects = await this.siteContent.getProjects()

    return projects.map((project) => `${baseUrl}/projets/${project.slug}`)
  }
}
