import { inject } from '@adonisjs/core';
import { ResetPasswordAction } from '#auth/actions/password/reset_password_action';
import { ValidatePasswordTokenAction } from '#auth/actions/password/validate_password_token_action';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { buildResetPasswordPayload } from '#transport/auth/helpers/i18n_payloads/reset_password';
import { resetPasswordValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { FullToken } from '#auth/enums/token_type';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class ResetPasswordController {
	constructor(
		protected i18n: I18nService,
		protected validatePasswordTokenAction: ValidatePasswordTokenAction,
		protected resetPasswordAction: ResetPasswordAction,
	) {}

	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		await this.validatePasswordTokenAction.execute({ token: params.token as FullToken });

		return renderInertiaPage(inertia, 'auth/front/reset_password', {
			token: params.token,
			translations: buildResetPasswordPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { request, response, session, auth } = ctx;

		const payload = await resetPasswordValidator.validate(request.all());

		const user = await this.resetPasswordAction.execute({
			...payload,
			token: payload.token as FullToken,
		});

		await auth.use('web').login(user);
		regenerateCsrfToken(ctx);

		session.flash('success', this.i18n.translate('auth.reset_password.success'));
		return response.redirect().toRoute('account.profile.render');
	}
}
