/*
|--------------------------------------------------------------------------
| Front routes
|--------------------------------------------------------------------------
|
| Hand-written public front — the home page and any future front routes a
| developer adds. Each route is named `front.*` so the sitemap route
| collector and developers can reference them consistently. The `inertia`
| flavor ships only the home page; the CMS public front (contact, page
| rendering) is pruned.
|
*/

import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

export function registerFrontRoutes(): void {
  router.get('/', [controllers.core.front.Home, 'render']).as('front.home')
  router.get('/services', [controllers.core.front.Services, 'render']).as('front.services')
  router.get('/projets', [controllers.core.front.Projects, 'render']).as('front.projects')
  router.get('/projets/:slug', [controllers.core.front.Project, 'render']).as('front.projects.show')
}
