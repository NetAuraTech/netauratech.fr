/*
|--------------------------------------------------------------------------
| File API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for files and folders.
| Self-registers on import (see `app/file/routes.ts`), gated by the
| `adminApi` feature flag. Public URLs live under
| `/api/v1/admin/{files,folders}`; route names carry the
| `api.v1.admin.file` prefix.
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
import { registerFileApiDocs } from '#transport/file/api_docs';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

if (features.adminApi) {
	// Document the file surface alongside the routes, so the OpenAPI spec
	// and the registry above stay in lockstep.
	registerFileApiDocs();

	router
		.group(() => {
			router
				.group(() => {
					// Files
					router
						.group(() => {
							router
								.get('/', [controllers.file.api.FilesApi, 'index'])
								.as('file.files.index')
								.use([middleware.permission({ permissions: [permissions.files.view] })]);
							router
								.post('/', [controllers.file.api.FilesUploadApi, 'store'])
								.as('file.files.store')
								.use([middleware.permission({ permissions: [permissions.files.create] })]);
							router
								.get('/:id', [controllers.file.api.FilesShowApi, 'show'])
								.as('file.files.show')
								.use([middleware.permission({ permissions: [permissions.files.view] })]);
							router
								.put('/:id/move', [controllers.file.api.FilesApi, 'move'])
								.as('file.files.move')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
							router
								.delete('/:id', [controllers.file.api.FilesDeleteApi, 'destroy'])
								.as('file.files.destroy')
								.use([middleware.permission({ permissions: [permissions.files.delete] })]);
							router
								.put('/:id/alt', [controllers.file.api.FilesAltApi, 'upsertAlt'])
								.as('file.files.upsert_alt')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
							router
								.delete('/:id/alt', [controllers.file.api.FilesAltApi, 'deleteAlt'])
								.as('file.files.delete_alt')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
						})
						.prefix('files');

					// Folders
					router
						.group(() => {
							router
								.get('/', [controllers.file.api.FoldersApi, 'index'])
								.as('file.folders.index')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							router
								.post('/', [controllers.file.api.FoldersApi, 'store'])
								.as('file.folders.store')
								.use([middleware.permission({ permissions: [permissions.folders.create] })]);
							router
								.get('/:id', [controllers.file.api.FoldersShowApi, 'show'])
								.as('file.folders.show')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							router
								.get('/:id/children', [controllers.file.api.FoldersShowApi, 'children'])
								.as('file.folders.children')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							router
								.put('/:id', [controllers.file.api.FoldersUpdateApi, 'update'])
								.as('file.folders.update')
								.use([middleware.permission({ permissions: [permissions.folders.update] })]);
							router
								.delete('/:id', [controllers.file.api.FoldersDeleteApi, 'destroy'])
								.as('file.folders.destroy')
								.use([middleware.permission({ permissions: [permissions.folders.delete] })]);
						})
						.prefix('folders');
				})
				.prefix('admin')
				.as('admin')
				.use([...maintenanceMiddleware, middleware.auth({ guards: [...apiGuards] }), apiClientThrottle()]);
		})
		.prefix('api/v1')
		.as('api.v1');
}
