/*
|--------------------------------------------------------------------------
| File API routes
|--------------------------------------------------------------------------
|
| Versioned REST API (access-token guard) for files and folders.
| Self-registers on import (see `app/file/routes.ts`), gated by the
| `adminApi` feature flag. Public URLs live under
| `/api/v1/admin/{files,folders}`; route names carry the
| `api.v1.admin.file` prefix. Each route registers its OpenAPI docs at its
| declaration (`registerApiDoc`), keyed by the route itself: the route name
| is derived from the route, never hand-assembled.
|
*/

import router from '@adonisjs/core/services/router';
import vine from '@vinejs/vine';
import { enabledAuthGuards } from '#config/auth';
import features from '#config/features';
import { controllers } from '#generated/controllers';
import { middleware } from '#start/kernel';
import { apiClientThrottle } from '#start/limiter';
import { permissions } from '#start/permissions';
import { maintenanceMiddleware } from '#transport/core/maintenance';
import { registerApiDoc, type ApiOperationDoc } from '#transport/core/openapi/api_docs_registry';
import { errorSchema, dataEnvelope } from '#transport/core/openapi/schemas';
import { filesEndpointsDocs, fileSchema } from '#transport/file/rest/files_resource';
import { foldersEndpointsDocs } from '#transport/file/rest/folders_resource';

/**
 * The admin JSON surface is shared: the in-repo admin UI (session guard) and
 * external API clients (access-token guard) consume the same endpoints.
 * Guards that are disabled in `config/auth.ts` must never reach
 * `authenticateUsing`, hence the conditional list.
 */
const apiGuards = enabledAuthGuards.api ? (['web', 'api'] as const) : (['web'] as const);

/**
 * The file-upload body: a multipart form with the required `file` field and
 * an optional target `folder_id`. The endpoint reads the multipart request
 * directly (no Vine validator), so this mirror documents its contract.
 */
const uploadFileBodyValidator = vine.create({
	file: vine.string().minLength(1),
	folder_id: vine.number().positive().optional(),
});

/** Docs for the file-upload route (not a thin endpoint dispatch). */
const uploadFileDoc: ApiOperationDoc = {
	summary: 'Upload a file',
	description: 'Multipart form with a required `file` field and an optional `folder_id` target.',
	tags: ['Files'],
	request: [{ validator: uploadFileBodyValidator, in: 'body', contentType: 'multipart/form-data' }],
	responses: {
		'201': { description: 'The uploaded file.', schema: dataEnvelope(fileSchema) },
		'400': { description: 'The `file` field is missing.', schema: errorSchema },
	},
};

if (features.adminApi) {
	router
		.group(() => {
			router
				.group(() => {
					// Files
					router
						.group(() => {
							registerApiDoc(router.get('/', [controllers.file.api.FilesApi, 'index']), filesEndpointsDocs.index)
								.as('file.files.index')
								.use([middleware.permission({ permissions: [permissions.files.view] })]);
							registerApiDoc(router.post('/', [controllers.file.api.FilesUploadApi, 'store']), uploadFileDoc)
								.as('file.files.store')
								.use([middleware.permission({ permissions: [permissions.files.create] })]);
							registerApiDoc(router.get('/:id', [controllers.file.api.FilesShowApi, 'show']), filesEndpointsDocs.show)
								.as('file.files.show')
								.use([middleware.permission({ permissions: [permissions.files.view] })]);
							registerApiDoc(router.put('/:id/move', [controllers.file.api.FilesApi, 'move']), filesEndpointsDocs.move)
								.as('file.files.move')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
							registerApiDoc(
								router.delete('/:id', [controllers.file.api.FilesDeleteApi, 'destroy']),
								filesEndpointsDocs.destroy,
							)
								.as('file.files.destroy')
								.use([middleware.permission({ permissions: [permissions.files.delete] })]);
							registerApiDoc(
								router.put('/:id/alt', [controllers.file.api.FilesAltApi, 'upsertAlt']),
								filesEndpointsDocs.upsertAlt,
							)
								.as('file.files.upsert_alt')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
							registerApiDoc(
								router.delete('/:id/alt', [controllers.file.api.FilesAltApi, 'deleteAlt']),
								filesEndpointsDocs.deleteAlt,
							)
								.as('file.files.delete_alt')
								.use([middleware.permission({ permissions: [permissions.files.update] })]);
						})
						.prefix('files');

					// Folders
					router
						.group(() => {
							registerApiDoc(router.get('/', [controllers.file.api.FoldersApi, 'index']), foldersEndpointsDocs.index)
								.as('file.folders.index')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							registerApiDoc(router.post('/', [controllers.file.api.FoldersApi, 'store']), foldersEndpointsDocs.store)
								.as('file.folders.store')
								.use([middleware.permission({ permissions: [permissions.folders.create] })]);
							registerApiDoc(
								router.get('/:id', [controllers.file.api.FoldersShowApi, 'show']),
								foldersEndpointsDocs.show,
							)
								.as('file.folders.show')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							registerApiDoc(
								router.get('/:id/children', [controllers.file.api.FoldersShowApi, 'children']),
								foldersEndpointsDocs.children,
							)
								.as('file.folders.children')
								.use([middleware.permission({ permissions: [permissions.folders.view] })]);
							registerApiDoc(
								router.put('/:id', [controllers.file.api.FoldersUpdateApi, 'update']),
								foldersEndpointsDocs.update,
							)
								.as('file.folders.update')
								.use([middleware.permission({ permissions: [permissions.folders.update] })]);
							registerApiDoc(
								router.delete('/:id', [controllers.file.api.FoldersDeleteApi, 'destroy']),
								foldersEndpointsDocs.destroy,
							)
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
