/*
|--------------------------------------------------------------------------
| Identity admin routes
|--------------------------------------------------------------------------
|
| Inertia admin surface (session guard) for users, roles, and permissions.
| Self-registers on import (see `app/identity/routes.ts`), gated by the
| `admin` feature flag. Public URLs live under
| `/admin/{users,roles,permissions}`; route names carry the
| `admin.identity` prefix.
|
*/

import router from '@adonisjs/core/services/router';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { permissions } from '#start/permissions';
import { maintenanceMiddleware } from '#transport/core/maintenance';

if (features.admin) {
	router
		.group(() => {
			// Users
			router
				.group(() => {
					router
						.get('/', [controllers.identity.admin.Users, 'render'])
						.use([middleware.permission({ permissions: [permissions.users.view] })]);

					router
						.group(() => {
							router.get('/', [controllers.identity.admin.UsersCreate, 'render']);
							router.post('/', [controllers.identity.admin.UsersCreate, 'execute']);
						})
						.prefix('create')
						.use([middleware.permission({ permissions: [permissions.users.create] })]);

					router
						.group(() => {
							router
								.delete('/', [controllers.identity.admin.Users, 'destroy'])
								.use([middleware.permission({ permissions: [permissions.users.delete] })]);
							router
								.get('/', [controllers.identity.admin.UsersShow, 'render'])
								.use([middleware.permission({ permissions: [permissions.users.view] })]);

							router
								.group(() => {
									router.get('/', [controllers.identity.admin.UsersUpdate, 'render']);
									router.post('/', [controllers.identity.admin.UsersUpdate, 'execute']);
								})
								.prefix('edit')
								.use([middleware.permission({ permissions: [permissions.users.update] })]);
						})
						.prefix(':id');
				})
				.prefix('users');

			// Roles
			router
				.group(() => {
					router
						.get('/', [controllers.identity.admin.Roles, 'render'])
						.use([middleware.permission({ permissions: [permissions.roles.view] })]);

					router
						.group(() => {
							router.get('/', [controllers.identity.admin.RolesCreate, 'render']);
							router.post('/', [controllers.identity.admin.RolesCreate, 'execute']);
						})
						.prefix('create')
						.use([middleware.permission({ permissions: [permissions.roles.create] })]);

					router
						.group(() => {
							router
								.delete('/', [controllers.identity.admin.Roles, 'destroy'])
								.use([middleware.permission({ permissions: [permissions.roles.delete] })]);
							router
								.get('/', [controllers.identity.admin.RolesShow, 'render'])
								.use([middleware.permission({ permissions: [permissions.roles.view] })]);

							router
								.group(() => {
									router.get('/', [controllers.identity.admin.RolesUpdate, 'render']);
									router.post('/', [controllers.identity.admin.RolesUpdate, 'execute']);
								})
								.prefix('edit')
								.use([middleware.permission({ permissions: [permissions.roles.update] })]);
						})
						.prefix(':id');
				})
				.prefix('roles');

			// Permissions
			router
				.group(() => {
					router
						.get('/', [controllers.identity.admin.Permissions, 'render'])
						.use([middleware.permission({ permissions: [permissions.permissions.view] })]);

					router
						.group(() => {
							router.get('/', [controllers.identity.admin.PermissionsCreate, 'render']);
							router.post('/', [controllers.identity.admin.PermissionsCreate, 'execute']);
						})
						.prefix('create')
						.use([middleware.permission({ permissions: [permissions.permissions.create] })]);

					router
						.group(() => {
							router
								.delete('/', [controllers.identity.admin.Permissions, 'destroy'])
								.use([middleware.permission({ permissions: [permissions.permissions.delete] })]);

							router
								.group(() => {
									router.get('/', [controllers.identity.admin.PermissionsUpdate, 'render']);
									router.post('/', [controllers.identity.admin.PermissionsUpdate, 'execute']);
								})
								.prefix('edit')
								.use([middleware.permission({ permissions: [permissions.permissions.update] })]);
						})
						.prefix(':id');
				})
				.prefix('permissions');
		})
		.prefix('admin')
		.as('admin.identity')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['web'] })]);
}
