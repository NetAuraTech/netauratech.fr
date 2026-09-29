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
