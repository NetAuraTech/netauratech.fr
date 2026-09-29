import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';

/**
 * Identity endpoint of the REST API (`/api/v1/auth`).
 */
@inject()
export default class MeController {
	/**
	 * GET /api/v1/auth/me
	 *
	 * Returns the user authenticated by the `Authorization: Bearer` token,
	 * serialized exactly like the session-based identity payloads (role and
	 * permissions included).
	 */
	async show(ctx: HttpContext) {
		const user = ctx.auth.use('api').getUserOrFail();

		await preloadUserRoleWithPermissions(user);

		return ctx.serialize(UserTransformer.transform(user.toDomain()));
	}
}
