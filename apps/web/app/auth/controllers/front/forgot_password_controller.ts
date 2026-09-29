import { inject } from '@adonisjs/core';
import { SendPasswordResetAction } from '#auth/actions/password/send_password_reset_action';
import { FindUserByEmailAction } from '#identity/actions/user/find_user_by_email_action';
import { buildForgotPasswordPayload } from '#transport/auth/helpers/i18n_payloads/forgot_password';
import { forgotPasswordValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class ForgotPasswordController {
	constructor(
		protected i18n: I18nService,
		protected findUserByEmailAction: FindUserByEmailAction,
		protected sendPasswordResetAction: SendPasswordResetAction,
	) {}

	render(ctx: HttpContext) {
		const { inertia } = ctx;

		return renderInertiaPage(inertia, 'auth/front/forgot_password', {
			translations: buildForgotPasswordPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { request, response, session } = ctx;

		const payload = await forgotPasswordValidator.validate(request.all());

		const user = await this.findUserByEmailAction.execute({ email: payload.email });

		if (user) {
			await this.sendPasswordResetAction.execute({ user });
		}

		session.flash('success', this.i18n.translate('auth.password.forgot.email_sent'));

		return response.redirect().toRoute('auth.session.render');
	}
}
