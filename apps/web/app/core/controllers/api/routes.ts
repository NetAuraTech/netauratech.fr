/*
|--------------------------------------------------------------------------
| Core API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for the dashboard figures and the
| maintenance configuration. Self-registers on import (see
| `app/core/routes.ts`), gated by the `adminApi` feature flag. Public URLs
| live under `/api/v1/admin/{dashboard,maintenance}`; route names carry the
| `api.v1.admin.core` prefix.
|
| Also hosts the OpenAPI surface, gated by the `apiDocs` feature flag:
| `GET /api/v1/openapi.json` (generated spec), guarded and named
| `api.v1.core.openapi.spec`. The spec is scoped to the authenticated user:
| only the routes their permissions allow are documented. The interactive
| reference UI lives on the front (`GET /api/docs`) as a self-hosted
| Vite/Edge page, not in this API namespace.
|
*/

import router from '@adonisjs/core/services/router';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { apiClientThrottle } from '#start/limiter';
import { permissions } from '#start/permissions';
import { registerCoreApiDocs } from '#transport/core/api_docs';
import { maintenanceMiddleware } from '#transport/core/maintenance';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	// Document the core surface alongside the routes, so the OpenAPI spec
	// and the registry above stay in lockstep.
	registerCoreApiDocs();

	router
		.group(() => {
			router
				.group(() => {
					// Dashboard
					router
						.get('/', [controllers.core.api.DashboardApi, 'index'])
						.prefix('dashboard')
						.as('core.dashboard.index')
						.use([middleware.permission({ permissions: [permissions.admin.access] })]);

					// Maintenance
					router
						.group(() => {
							router
								.get('/', [controllers.core.api.MaintenanceApi, 'index'])
								.as('core.maintenance.index')
								.use([middleware.permission({ permissions: [permissions.settings.maintenance] })]);
							router
								.put('/', [controllers.core.api.MaintenanceApi, 'update'])
								.as('core.maintenance.update')
								.use([middleware.permission({ permissions: [permissions.settings.maintenance] })]);
							router
								.put('/toggle', [controllers.core.api.MaintenanceApi, 'toggle'])
								.as('core.maintenance.toggle')
								.use([middleware.permission({ permissions: [permissions.settings.maintenance] })]);
						})
						.prefix('maintenance');
				})
				.prefix('admin')
				.as('admin')
				.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
		})
		.prefix('api/v1')
		.as('api.v1');
}

// The OpenAPI surface is guarded like the admin API: the spec documents the
// endpoints the authenticated user may call, so it carries the same guards
// and is scoped to their permissions. The interactive reference UI over it
// lives on the front (`/api/docs`), not in this API namespace.
if (features.apiDocs) {
	router
		.get('openapi.json', [controllers.core.api.Openapi, 'spec'])
		.as('core.openapi.spec')
		.prefix('api/v1')
		// Spec generation is comparatively heavy: authenticated clients
		// share the per-client budget like the rest of the API surface.
		.use([middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
}
