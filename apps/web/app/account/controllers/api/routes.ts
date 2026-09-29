/*
|--------------------------------------------------------------------------
| Account API routes
|--------------------------------------------------------------------------
|
| Versioned token API (`/api/v1/{profile,account}`) for non-browser clients
| — session cookies are never consulted — plus the admin theme preference
| endpoint (`/api/v1/admin/preferences/theme`) shared with the in-repo admin
| UI. Self-registers on import (see `app/account/routes.ts`), gated by the
| `adminApi` feature flag; the token API additionally requires the `api`
| access-token guard. Route names carry the `api.v1.account` prefix.
|
*/

import router from '@adonisjs/core/services/router';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { apiClientThrottle } from '#start/limiter';
import { registerAccountApiDocs } from '#transport/account/api_docs';
import { maintenanceMiddleware } from '#transport/core/maintenance';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi && enabledAuthGuards.api) {
	router
		.group(() => {
			router
				.group(() => {
					router.get('/', [controllers.account.api.Profile, 'show']).as('account.profile.show');
					router.put('/', [controllers.account.api.Profile, 'update']).as('account.profile.update');
				})
				.prefix('profile');

			router
				.group(() => {
					router.put('/', [controllers.account.api.Account, 'update']).as('account.account.update');
					router.delete('/', [controllers.account.api.Account, 'destroy']).as('account.account.destroy');
				})
				.prefix('account');
		})
		.prefix('api/v1')
		.as('api.v1')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['api'] }), apiClientThrottle()]);
}

if (features.adminApi) {
	// Document the account surface alongside the routes, so the OpenAPI spec
	// and the registry above stay in lockstep.
	registerAccountApiDocs();

	router
		.group(() => {
			router
				.post('preferences/theme', [controllers.account.api.Preferences, 'execute'])
				.as('account.preferences.execute');
		})
		.prefix('api/v1/admin')
		.as('api.v1.admin')
		.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
}
