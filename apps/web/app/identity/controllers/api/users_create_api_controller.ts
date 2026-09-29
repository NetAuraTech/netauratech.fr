import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import UsersResource from '#transport/identity/rest/users_resource';

/**
 * POST /api/v1/admin/users — create a user from the admin REST API.
 *
 * Thin transport adapter over the `store` endpoint of the
 * {@link UsersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class UsersCreateApiController {
	constructor(protected usersResource: UsersResource) {}

	/**
	 * Create a user and return the persisted state.
	 */
	async store(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.usersResource.endpoints.store);
	}
}
