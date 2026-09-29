import { inject } from '@adonisjs/core';
import { VerifyEmailAction } from '#auth/actions/email_verification/verify_email_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { FullToken } from '#auth/enums/token_type';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class EmailVerificationController {
	constructor(
		protected i18n: I18nService,
		protected verifyEmailAction: VerifyEmailAction,
	) {}

	async execute(ctx: HttpContext) {
		const { params, response, session, auth } = ctx;

		// Invalid or expired tokens propagate as InvalidTokenException:
		// browsers are redirected back to the login page, API clients get a
		// coded 400 (E_INVALID_TOKEN).
		const user = await this.verifyEmailAction.execute({ token: params.token as FullToken });

		if (!auth.user) {
			await auth.use('web').login(user);
		}

		session.flash('success', this.i18n.translate('auth.verify_email.success'));

		return response.redirect().toRoute('account.profile.render');
	}
}
