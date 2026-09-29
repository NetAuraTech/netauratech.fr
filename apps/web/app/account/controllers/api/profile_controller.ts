import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import ProfileResource from '#transport/account/rest/profile_resource';
import { handle } from '#transport/core/rest/rest_adapter';

/**
 * GET /api/v1/profile — show the current user's profile (self).
 * PUT /api/v1/profile — update the current user's username (self).
 *
 * Thin transport adapter over the endpoints of the {@link ProfileResource};
 * each endpoint declaration is executed by the shared REST pipeline.
 */
@inject()
export default class ProfileController {
	constructor(protected profileResource: ProfileResource) {}

	async show(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.profileResource.endpoints.show);
	}

	async update(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.profileResource.endpoints.update);
	}
}
