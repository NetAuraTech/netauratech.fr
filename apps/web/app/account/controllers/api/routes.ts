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
| access-token guard. Route names carry the `api.v1.account` prefix. Each
| route registers its OpenAPI docs at its declaration (`registerApiDoc`),
| keyed by the route itself: the route name is derived from the route, never
| hand-assembled.
|
*/

import router from '@adonisjs/core/services/router';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { apiClientThrottle } from '#start/limiter';
import { accountApiDocs } from '#transport/account/rest/account_resource';
import { profileEndpointsDocs } from '#transport/account/rest/profile_resource';
import { updateValidator as preferencesValidator } from '#transport/account/validators/preference';
import { maintenanceMiddleware } from '#transport/core/maintenance';
import { registerApiDoc, type ApiOperationDoc } from '#transport/core/openapi/api_docs_registry';
import { validationErrorSchema } from '#transport/core/openapi/schemas';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

const preferencesDoc: ApiOperationDoc = {
	summary: "Update the current user's preferences",
	description: 'Theme and/or locale preference; fields are optional so a single preference can be posted.',
	tags: ['Account'],
	request: [{ validator: preferencesValidator, in: 'body' }],
	responses: {
		'200': { description: 'A success message (translated string).', schema: { type: 'string' } },
		'422': { description: 'Validation failed.', schema: validationErrorSchema },
	},
};

if (features.adminApi && enabledAuthGuards.api) {
	router
		.group(() => {
			router
				.group(() => {
					registerApiDoc(router.get('/', [controllers.account.api.Profile, 'show']), profileEndpointsDocs.show).as(
						'account.profile.show',
					);
					registerApiDoc(router.put('/', [controllers.account.api.Profile, 'update']), profileEndpointsDocs.update).as(
						'account.profile.update',
					);
				})
				.prefix('profile');

			router
				.group(() => {
					registerApiDoc(router.put('/', [controllers.account.api.Account, 'update']), accountApiDocs.update).as(
						'account.account.update',
					);
					registerApiDoc(router.delete('/', [controllers.account.api.Account, 'destroy']), accountApiDocs.destroy).as(
						'account.account.destroy',
					);
				})
				.prefix('account');
		})
		.prefix('api/v1')
		.as('api.v1')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['api'] }), apiClientThrottle()]);
}

if (features.adminApi) {
	router
		.group(() => {
			registerApiDoc(
				router.post('preferences/theme', [controllers.account.api.Preferences, 'execute']),
				preferencesDoc,
			).as('account.preferences.execute');
		})
		.prefix('api/v1/admin')
		.as('api.v1.admin')
		.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
}
