import { inject } from '@adonisjs/core';
import { SendPasswordResetAction } from '#auth/actions/password/send_password_reset_action';
import { FindUserByEmailAction } from '#identity/actions/user/find_user_by_email_action';
import { forgotPasswordValidator } from '#transport/auth/validators/auth';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * POST /api/v1/auth/forgot-password — request a password-reset email.
 * Always returns 200 (even for unknown emails) to avoid account enumeration.
 */
@inject()
export default class ForgotPasswordController {
	constructor(
		protected findUserByEmailAction: FindUserByEmailAction,
		protected sendPasswordResetAction: SendPasswordResetAction,
	) {}

	async store(ctx: HttpContext) {
		const { request, response } = ctx;

		const payload = await forgotPasswordValidator.validate(request.all());

		const user = await this.findUserByEmailAction.execute({ email: payload.email });

		if (user) {
			await this.sendPasswordResetAction.execute({ user });
		}

		return response.ok({ message: 'reset_email_sent' });
	}
}
