/*
|--------------------------------------------------------------------------
| Log API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for the application log viewer.
| Self-registers on import (see `app/log/routes.ts`), gated by the
| `adminApi` feature flag. Public URL lives under `/api/v1/admin/logs`;
| route names carry the `api.v1.admin.log` prefix. Each route registers its
| OpenAPI docs at its declaration (`registerApiDoc`), keyed by the route
| itself: the route name is derived from the route, never hand-assembled.
|
*/

import router from '@adonisjs/core/services/router';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { apiClientThrottle } from '#start/limiter';
import { permissions } from '#start/permissions';
import { maintenanceMiddleware } from '#transport/core/maintenance';
import { registerApiDoc } from '#transport/core/openapi/api_docs_registry';
import { logsEndpointsDocs } from '#transport/log/rest/logs_resource';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	router
		.group(() => {
			router
				.group(() => {
					// Logs
					router
						.group(() => {
							registerApiDoc(router.get('/', [controllers.log.api.LogsApi, 'index']), logsEndpointsDocs.index)
								.as('log.logs.index')
								.use([middleware.permission({ permissions: [permissions.logs.view] })]);
						})
						.prefix('logs');
				})
				.prefix('admin')
				.as('admin')
				.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
		})
		.prefix('api/v1')
		.as('api.v1');
}
