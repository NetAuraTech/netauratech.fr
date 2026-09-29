import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import UsersResource from '#transport/identity/rest/users_resource';

/**
 * GET /api/v1/admin/users — list users of the admin REST API.
 *
 * Thin transport adapter over the `index` endpoint of the
 * {@link UsersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class UsersApiController {
	constructor(protected usersResource: UsersResource) {}

	/**
	 * List users with search/role filters and pagination.
	 */
	async index(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.usersResource.endpoints.index);
	}
}
