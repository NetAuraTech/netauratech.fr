import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { RevokeApiTokenAction } from '#auth/actions/token/revoke_api_token_action';

/**
 * Logout endpoint of the REST API (`/api/v1/auth`), guarded by the `api`
 * access-token guard.
 */
@inject()
export default class LogoutController {
	constructor(protected revokeApiTokenAction: RevokeApiTokenAction) {}

	/**
	 * POST /api/v1/auth/logout
	 *
	 * Revokes the access token presented on the request. Other tokens of the
	 * same user keep working.
	 */
	async destroy(ctx: HttpContext) {
		const { auth, response } = ctx;

		const user = auth.use('api').getUserOrFail();
		await this.revokeApiTokenAction.execute({
			user,
			tokenIdentifier: user.currentAccessToken.identifier,
		});

		return response.noContent();
	}
}
