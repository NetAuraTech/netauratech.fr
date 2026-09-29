/*
|--------------------------------------------------------------------------
| Core admin routes
|--------------------------------------------------------------------------
|
| Inertia admin surface (session guard) for the dashboard and the
| maintenance settings. Self-registers on import (see `app/core/routes.ts`),
| gated by the `admin` feature flag. Public URLs live under `/admin` and
| `/admin/settings/maintenance{,/toggle}`; route names carry the
| `admin.core` prefix.
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
			router
				.get('/', [controllers.core.admin.Dashboard, 'render'])
				.use([middleware.permission({ permissions: [permissions.admin.access] })]);

			router
				.group(() => {
					router.get('/settings/maintenance', [controllers.core.admin.Maintenance, 'render']);
					router.post('/settings/maintenance', [controllers.core.admin.Maintenance, 'update']);
					router.post('/settings/maintenance/toggle', [controllers.core.admin.Maintenance, 'toggle']);
				})
				.use([middleware.permission({ permissions: [permissions.settings.maintenance] })]);
		})
		.prefix('admin')
		.as('admin.core')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['web'] })]);
}
