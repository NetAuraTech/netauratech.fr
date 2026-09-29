import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { handle } from '#transport/core/rest/rest_adapter';
import UsersResource from '#transport/identity/rest/users_resource';

/**
 * GET /api/v1/admin/users/:id — show a single user from the admin REST API.
 *
 * Thin transport adapter over the `show` endpoint of the
 * {@link UsersResource}; the endpoint declaration is executed by the shared
 * REST pipeline.
 */
@inject()
export default class UsersShowApiController {
	constructor(protected usersResource: UsersResource) {}

	/**
	 * Show a single user by id.
	 */
	async show(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.usersResource.endpoints.show);
	}
}
