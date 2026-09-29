import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import UsersResource from '#transport/identity/rest/users_resource';

/**
 * DELETE /api/v1/admin/users/:id — delete a user from the admin REST API.
 *
 * Thin transport adapter over the `destroy` endpoint of the
 * {@link UsersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class UsersDeleteApiController {
	constructor(protected usersResource: UsersResource) {}

	/**
	 * Delete a user by id.
	 */
	async destroy(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.usersResource.endpoints.destroy);
	}
}
