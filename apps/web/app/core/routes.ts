/*
|--------------------------------------------------------------------------
| Core routes
|--------------------------------------------------------------------------
|
| Core domain surface entry — mirrors `start/routes.ts`: each surface
| self-registers on import, co-located with the controllers it binds, and
| gates itself on its feature flag. The public SEO surface (sitemap.xml,
| robots.txt) is unconditional, the admin Inertia surface (dashboard,
| maintenance; session guard) and the versioned REST API (dashboard,
| maintenance; access-token guard) live under `controllers/`. Public URLs
| are unchanged from the previous `start/routes` placement.
|
| The core home route and the health routes are exported separately: the
| home is dead on `main` while the CMS page home serves the site root, and
| the health probes must stay outside the maintenance middleware.
|
*/

import '#transport/core/controllers/admin/routes';
import '#transport/core/controllers/api/routes';
import '#transport/core/controllers/front/routes';
import router from '@adonisjs/core/services/router';
import { controllers } from '#generated/controllers';

/**
 * The core home route — the hand-written `GET /` of the public front.
 *
 * Dead on `main`: the CMS page-home route serves the site root while the CMS
 * module exists, so this route is registered nowhere in `main` (behavior
 * unchanged). The `inertia` flavor — which prunes the CMS — registers it from
 * the `start/routes.ts` rewrite; the site root switches to this route when
 * the CMS batch removes the page-home route.
 */
export function registerCoreHomeRoute(): void {
	router.get('/', [controllers.core.front.Home, 'render']).as('core.home.render');
}
