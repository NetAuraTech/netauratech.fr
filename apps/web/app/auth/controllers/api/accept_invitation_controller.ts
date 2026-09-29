import { inject } from '@adonisjs/core';
import { AcceptInvitationAction } from '#auth/actions/invitation/accept_invitation_action';
import { GetInvitationAction } from '#auth/actions/invitation/get_invitation_action';
import InvalidTokenException from '#auth/exceptions/invalid_token_exception';
import { invalidTokenNotFound } from '#transport/auth/helpers/error_response';
import { invitationValidator, acceptInvitationValidator } from '#transport/auth/validators/auth';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { FullToken } from '#auth/enums/token_type';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * POST /api/v1/auth/accept-invitation — accept an invitation and set a password.
 * Returns a canonical 404 error body when the token is invalid.
 */
@inject()
export default class AcceptInvitationController {
	constructor(
		protected getInvitationAction: GetInvitationAction,
		protected acceptInvitationAction: AcceptInvitationAction,
	) {}

	async store(ctx: HttpContext) {
		const { request, response, serialize } = ctx;

		const { token } = await invitationValidator.validate(request.only(['token']));

		let invitedUser;
		try {
			invitedUser = await this.getInvitationAction.execute({ token: token as FullToken });
		} catch (error) {
			if (error instanceof InvalidTokenException) {
				return invalidTokenNotFound(ctx);
			}
			throw error;
		}

		const payload = await acceptInvitationValidator(invitedUser.id).validate(request.all());

		const user = await this.acceptInvitationAction.execute({
			token: token as FullToken,
			password: payload.password,
		});

		await preloadUserRoleWithPermissions(user);

		const serialized = await serialize(UserTransformer.transform(user.toDomain()));

		return response.ok(serialized);
	}
}
