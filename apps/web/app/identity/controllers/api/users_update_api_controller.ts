import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import UsersResource from '#transport/identity/rest/users_resource';

/**
 * PUT /api/v1/admin/users/:id — update a user from the admin REST API.
 *
 * Thin transport adapter over the `update` endpoint of the
 * {@link UsersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class UsersUpdateApiController {
	constructor(protected usersResource: UsersResource) {}

	/**
	 * Update a user and return the persisted state.
	 */
	async update(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.usersResource.endpoints.update);
	}
}
