/*
|--------------------------------------------------------------------------
| File admin routes
|--------------------------------------------------------------------------
|
| Inertia admin surface (session guard) for files and file folders.
| Self-registers on import (see `app/file/routes.ts`), gated by the
| `admin` feature flag. Public URLs live under `/admin/files{,/folders}`;
| route names carry the `admin.file` prefix.
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
			// Files
			router
				.group(() => {
					router
						.get('/', [controllers.file.admin.Files, 'render'])
						.use([middleware.permission({ permissions: [permissions.files.view] })]);
					router
						.post('/upload', [controllers.file.admin.Files, 'upload'])
						.use([middleware.permission({ permissions: [permissions.files.create] })]);
					router
						.post('/:id/move', [controllers.file.admin.Files, 'move'])
						.use([middleware.permission({ permissions: [permissions.files.update] })]);
					router
						.delete('/:id', [controllers.file.admin.Files, 'destroy'])
						.use([middleware.permission({ permissions: [permissions.files.delete] })]);
					router
						.post('/:id/alts', [controllers.file.admin.Files, 'upsertAlt'])
						.use([middleware.permission({ permissions: [permissions.files.update] })]);
					router
						.delete('/:id/alts', [controllers.file.admin.Files, 'deleteAlt'])
						.use([middleware.permission({ permissions: [permissions.files.update] })]);
				})
				.prefix('files');

			// File folders
			router
				.group(() => {
					router
						.get('/', [controllers.file.admin.FileFolders, 'render'])
						.use([middleware.permission({ permissions: [permissions.folders.view] })]);
					router
						.post('/', [controllers.file.admin.FileFolders, 'execute'])
						.use([middleware.permission({ permissions: [permissions.folders.create] })]);
					router
						.put('/:id', [controllers.file.admin.FileFolders, 'update'])
						.use([middleware.permission({ permissions: [permissions.folders.update] })]);
					router
						.delete('/:id', [controllers.file.admin.FileFolders, 'destroy'])
						.use([middleware.permission({ permissions: [permissions.folders.delete] })]);
				})
				.prefix('files/folders');
		})
		.prefix('admin')
		.as('admin.file')
		.use([...maintenanceMiddleware, middleware.auth({ guards: ['web'] })]);
}
