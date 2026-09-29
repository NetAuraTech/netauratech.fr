import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import FoldersResource from '#transport/file/rest/folders_resource';

/**
 * DELETE /api/v1/admin/folders/:id — delete a folder from the admin REST API.
 *
 * Thin transport adapter over the `destroy` endpoint of the
 * {@link FoldersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class FoldersDeleteApiController {
	constructor(protected foldersResource: FoldersResource) {}

	async destroy(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.foldersResource.endpoints.destroy);
	}
}
