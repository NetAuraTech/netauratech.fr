import { inject } from '@adonisjs/core'
import router from '@adonisjs/core/services/router'
import type { RouteJSON } from '@adonisjs/core/types/http'
import env from '#start/env'
import sitemapConfig from '#config/sitemap'
import type { SitemapContributor } from '#types/sitemap'

/**
 * Always-present sitemap contributor that enumerates hand-written front routes.
 *
 * Every GET route whose name starts with `front.` and whose pattern carries no
 * path parameter is included, which lets developers add a static front route
 * (`router.get('/about').as('front.about')`) and see it in the sitemap with no
 * further wiring. Parameterised, non-GET, unnamed, and non-`front.*` routes are
 * excluded by construction — so auth, admin, and API routes never leak.
 *
 * Route names and patterns listed in `config/sitemap.ts` `exclusions` are
 * dropped here, before URL construction.
 */
@inject()
export class RouteSitemapCollector implements SitemapContributor {
  readonly name = 'routes'

  /**
   * Enumerate the collectable `front.*` routes as absolute URLs.
   *
   * @returns Absolute URLs for every parameter-free GET route named `front.*`,
   * minus exclusions.
   */
  async collect(): Promise<string[]> {
    router.commit()

    const baseUrl = env.get('APP_URL')
    const routes = Object.values(router.toJSON()).flat() as RouteJSON[]

    return routes
      .filter((route) => this.isCollectable(route))
      .map((route) => `${baseUrl}${route.pattern}`)
  }

  /**
   * Whether a route should appear in the sitemap.
   *
   * A route is collectable when it is named `front.*`, responds to GET, has a
   * parameter-free pattern, and is not excluded by name or pattern.
   *
   * @param route - A serialized route from `router.toJSON()`.
   */
  protected isCollectable(route: RouteJSON): boolean {
    if (!route.name || !route.name.startsWith('front.')) return false
    if (!route.methods.includes('GET')) return false
    if (route.pattern.includes(':') || route.pattern.includes('*')) return false

    const exclusions = sitemapConfig.exclusions
    if (exclusions.includes(route.name)) return false
    if (exclusions.includes(route.pattern)) return false

    return true
  }
}
