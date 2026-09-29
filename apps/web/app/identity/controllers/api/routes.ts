/*
|--------------------------------------------------------------------------
| Identity API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for users, roles, and
| permissions. Self-registers on import (see `app/identity/routes.ts`),
| gated by the `adminApi` feature flag. Public URLs live under
| `/api/v1/admin/{users,roles,permissions}`; route names carry the
| `api.v1.admin.identity` prefix.
|
| Also registers the OpenAPI docs for this surface (see
| `#transport/identity/api_docs`), consumed by the generated spec.
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
import { registerIdentityApiDocs } from '#transport/identity/api_docs';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	// Document the identity surface alongside the routes, so the OpenAPI spec
	// and the registry above stay in lockstep.
	registerIdentityApiDocs();

	router
		.group(() => {
			router
				.group(() => {
					// Users
					router
						.group(() => {
							router
								.get('/', [controllers.identity.api.UsersApi, 'index'])
								.as('identity.users.index')
								.use([middleware.permission({ permissions: [permissions.users.view] })]);
							router
								.post('/', [controllers.identity.api.UsersCreateApi, 'store'])
								.as('identity.users.store')
								.use([middleware.permission({ permissions: [permissions.users.create] })]);
							router
								.get('/:id', [controllers.identity.api.UsersShowApi, 'show'])
								.as('identity.users.show')
								.use([middleware.permission({ permissions: [permissions.users.view] })]);
							router
								.put('/:id', [controllers.identity.api.UsersUpdateApi, 'update'])
								.as('identity.users.update')
								.use([middleware.permission({ permissions: [permissions.users.update] })]);
							router
								.delete('/:id', [controllers.identity.api.UsersDeleteApi, 'destroy'])
								.as('identity.users.destroy')
								.use([middleware.permission({ permissions: [permissions.users.delete] })]);
						})
						.prefix('users');

					// Roles
					router
						.group(() => {
							router
								.get('/', [controllers.identity.api.RolesApi, 'index'])
								.as('identity.roles.index')
								.use([middleware.permission({ permissions: [permissions.roles.view] })]);
							router
								.post('/', [controllers.identity.api.RolesCreateApi, 'store'])
								.as('identity.roles.store')
								.use([middleware.permission({ permissions: [permissions.roles.create] })]);
							router
								.get('/:id', [controllers.identity.api.RolesShowApi, 'show'])
								.as('identity.roles.show')
								.use([middleware.permission({ permissions: [permissions.roles.view] })]);
							router
								.put('/:id', [controllers.identity.api.RolesUpdateApi, 'update'])
								.as('identity.roles.update')
								.use([middleware.permission({ permissions: [permissions.roles.update] })]);
							router
								.delete('/:id', [controllers.identity.api.RolesDeleteApi, 'destroy'])
								.as('identity.roles.destroy')
								.use([middleware.permission({ permissions: [permissions.roles.delete] })]);
						})
						.prefix('roles');

					// Permissions
					router
						.get('permissions', [controllers.identity.api.PermissionsApi, 'index'])
						.as('identity.permissions.index')
						.use([middleware.permission({ permissions: [permissions.roles.view] })]);
				})
				.prefix('admin')
				.as('admin')
				.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
		})
		.prefix('api/v1')
		.as('api.v1');
}
