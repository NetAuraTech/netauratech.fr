/*
|--------------------------------------------------------------------------
| Identity API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for users, roles, and
| permissions. Self-registers on import (see `app/identity/routes.ts`),
| gated by the `adminApi` feature flag. Public URLs live under
| `/api/v1/admin/{users,roles,permissions}`; route names carry the
| `api.v1.admin.identity` prefix. Each route registers its OpenAPI docs at
| its declaration (`registerApiDoc`), keyed by the route itself: the route
| name is derived from the route, never hand-assembled.
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
import { permissionsEndpointsDocs } from '#transport/identity/rest/permissions_resource';
import { rolesEndpointsDocs } from '#transport/identity/rest/roles_resource';
import { usersEndpointsDocs } from '#transport/identity/rest/users_resource';

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
					// Users
					router
						.group(() => {
							registerApiDoc(router.get('/', [controllers.identity.api.UsersApi, 'index']), usersEndpointsDocs.index)
								.as('identity.users.index')
								.use([middleware.permission({ permissions: [permissions.users.view] })]);
							registerApiDoc(
								router.post('/', [controllers.identity.api.UsersCreateApi, 'store']),
								usersEndpointsDocs.store,
							)
								.as('identity.users.store')
								.use([middleware.permission({ permissions: [permissions.users.create] })]);
							registerApiDoc(
								router.get('/:id', [controllers.identity.api.UsersShowApi, 'show']),
								usersEndpointsDocs.show,
							)
								.as('identity.users.show')
								.use([middleware.permission({ permissions: [permissions.users.view] })]);
							registerApiDoc(
								router.put('/:id', [controllers.identity.api.UsersUpdateApi, 'update']),
								usersEndpointsDocs.update,
							)
								.as('identity.users.update')
								.use([middleware.permission({ permissions: [permissions.users.update] })]);
							registerApiDoc(
								router.delete('/:id', [controllers.identity.api.UsersDeleteApi, 'destroy']),
								usersEndpointsDocs.destroy,
							)
								.as('identity.users.destroy')
								.use([middleware.permission({ permissions: [permissions.users.delete] })]);
						})
						.prefix('users');

					// Roles
					router
						.group(() => {
							registerApiDoc(router.get('/', [controllers.identity.api.RolesApi, 'index']), rolesEndpointsDocs.index)
								.as('identity.roles.index')
								.use([middleware.permission({ permissions: [permissions.roles.view] })]);
							registerApiDoc(
								router.post('/', [controllers.identity.api.RolesCreateApi, 'store']),
								rolesEndpointsDocs.store,
							)
								.as('identity.roles.store')
								.use([middleware.permission({ permissions: [permissions.roles.create] })]);
							registerApiDoc(
								router.get('/:id', [controllers.identity.api.RolesShowApi, 'show']),
								rolesEndpointsDocs.show,
							)
								.as('identity.roles.show')
								.use([middleware.permission({ permissions: [permissions.roles.view] })]);
							registerApiDoc(
								router.put('/:id', [controllers.identity.api.RolesUpdateApi, 'update']),
								rolesEndpointsDocs.update,
							)
								.as('identity.roles.update')
								.use([middleware.permission({ permissions: [permissions.roles.update] })]);
							registerApiDoc(
								router.delete('/:id', [controllers.identity.api.RolesDeleteApi, 'destroy']),
								rolesEndpointsDocs.destroy,
							)
								.as('identity.roles.destroy')
								.use([middleware.permission({ permissions: [permissions.roles.delete] })]);
						})
						.prefix('roles');

					// Permissions
					registerApiDoc(
						router.get('permissions', [controllers.identity.api.PermissionsApi, 'index']),
						permissionsEndpointsDocs.index,
					)
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
