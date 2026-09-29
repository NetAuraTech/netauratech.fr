import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import FilesResource from '#transport/file/rest/files_resource';

/**
 * DELETE /api/v1/admin/files/:id — delete a file from the admin REST API.
 *
 * Thin transport adapter over the `destroy` endpoint of the
 * {@link FilesResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class FilesDeleteApiController {
	constructor(protected filesResource: FilesResource) {}

	async destroy(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.filesResource.endpoints.destroy);
	}
}
