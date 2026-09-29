import { inject } from '@adonisjs/core';
import { SendEmailVerificationAction } from '#auth/actions/email_verification/send_email_verification_action';
import { RegisterUserAction } from '#auth/actions/session/register_user_action';
import { registerValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { preloadUserRoleWithPermissions } from '#transport/identity/helpers/load_user_role';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * POST /api/v1/auth/register — public self-registration for API clients.
 * Creates the user and dispatches the email-verification flow.
 */
@inject()
export default class RegisterController {
	constructor(
		protected i18n: I18nService,
		protected registerUserAction: RegisterUserAction,
		protected sendEmailVerificationAction: SendEmailVerificationAction,
	) {}

	/**
	 * Register a new user and dispatch the email-verification flow.
	 */
	async store(ctx: HttpContext) {
		const { request, response, serialize } = ctx;

		const payload = await registerValidator.validate(request.all());

		const user = await this.registerUserAction.execute({
			...payload,
			locale: this.i18n.getLocale(),
		});

		await this.sendEmailVerificationAction.execute({ user });

		await preloadUserRoleWithPermissions(user);

		const serialized = await serialize(UserTransformer.transform(user.toDomain()));

		return response.created(serialized);
	}
}
