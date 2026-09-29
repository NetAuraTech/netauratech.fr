/*
|--------------------------------------------------------------------------
| Log API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for the application log viewer.
| Self-registers on import (see `app/log/routes.ts`), gated by the
| `adminApi` feature flag. Public URL lives under `/api/v1/admin/logs`;
| route names carry the `api.v1.admin.log` prefix.
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
import { registerLogApiDocs } from '#transport/log/api_docs';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	// Document the log surface alongside the routes, so the OpenAPI spec
	// and the registry above stay in lockstep.
	registerLogApiDocs();

	router
		.group(() => {
			router
				.group(() => {
					// Logs
					router
						.group(() => {
							router
								.get('/', [controllers.log.api.LogsApi, 'index'])
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
