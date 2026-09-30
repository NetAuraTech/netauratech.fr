/*
|--------------------------------------------------------------------------
| Core front routes
|--------------------------------------------------------------------------
|
| Public SEO surface of the core domain: `sitemap.xml` and `robots.txt`.
| They must exist in every flavor that has a public front, independently of
| the CMS module — registered unconditionally (alongside the CMS public
| routes) so the endpoints survive a CMS prune. Self-registers on import
| (see `app/core/routes.ts`).
|
| The core home route is deliberately not registered here: on `main` the CMS
| page home serves the site root, so the home is exported separately from
| `app/core/routes.ts` for the flavors that prune the CMS.
|
*/

import router from '@adonisjs/core/services/router';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { maintenanceMiddleware } from '#transport/core/maintenance';

// Content-driven front pages. The route collector picks up every parameter-free
// `core.*.render` GET route for the sitemap, so `core.projects.render` and
// `core.services.render` are listed automatically; the parameterised
// `core.projects.show.render` route is enumerated by the project sitemap
// contributor instead (see `start/sitemap.ts`).
router
	.group(() => {
		router.get('/projets', [controllers.core.front.Projects, 'render']).as('core.projects.render');
		router.get('/projets/:slug', [controllers.core.front.Project, 'render']).as('core.projects.show.render');
		router.get('/services', [controllers.core.front.Services, 'render']).as('core.services.render');
	})
	.use(maintenanceMiddleware);

router
	.group(() => {
		router.get('/sitemap.xml', [controllers.core.front.Sitemap, 'show']).as('core.sitemap.show');
		router.get('/robots.txt', [controllers.core.front.Robots, 'show']).as('core.robots.show');
	})
	.use(maintenanceMiddleware);

// The self-hosted API reference page is the human-facing companion to the
// `/api/v1/openapi.json` spec route. The spec is scoped to the authenticated
// user's permissions, so the page requires the same browser session (web
// guard) and is gated by the `apiDocs` feature flag. Like the spec, it stays
// outside the maintenance-mode middleware.
if (features.apiDocs) {
	router
		.get('/api/docs', [controllers.core.front.Docs, 'show'])
		.as('core.docs.show')
		.use(middleware.auth({ guards: ['web'] }));
}
