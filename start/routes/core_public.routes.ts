/*
|--------------------------------------------------------------------------
| Core public routes
|--------------------------------------------------------------------------
|
| `sitemap.xml` and `robots.txt` are core SEO endpoints: they must exist in
| every flavor that has a public front, independently of the CMS module. They
| are registered unconditionally (alongside the CMS public routes) so the
| endpoints survive a CMS prune.
|
*/

import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

export function registerCorePublicRoutes(): void {
  router.get('/sitemap.xml', [controllers.core.front.Sitemap, 'show'])
  router.get('/robots.txt', [controllers.core.front.Robots, 'show'])
}
