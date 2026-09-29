import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import RolesResource from '#transport/identity/rest/roles_resource';

/**
 * GET /api/v1/admin/roles — list roles from the admin REST API.
 *
 * Thin transport adapter over the `index` endpoint of the
 * {@link RolesResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class RolesApiController {
	constructor(protected rolesResource: RolesResource) {}

	async index(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.rolesResource.endpoints.index);
	}
}
