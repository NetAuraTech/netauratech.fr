import { inject } from '@adonisjs/core';
import { SendEmailVerificationAction } from '#auth/actions/email_verification/send_email_verification_action';
import { RegisterUserAction } from '#auth/actions/session/register_user_action';
import { enabledProviders } from '#auth/oauth_providers';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { buildRegisterPayload } from '#transport/auth/helpers/i18n_payloads/register';
import { registerValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class RegisterController {
	constructor(
		protected i18n: I18nService,
		protected registerUserAction: RegisterUserAction,
		protected sendEmailVerificationAction: SendEmailVerificationAction,
	) {}

	render(ctx: HttpContext) {
		const { inertia } = ctx;

		return renderInertiaPage(inertia, 'auth/front/register', {
			providers: enabledProviders,
			translations: buildRegisterPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { request, response, auth, session } = ctx;

		const payload = await registerValidator.validate(request.all());

		const user = await this.registerUserAction.execute({
			...payload,
			locale: this.i18n.getLocale(),
		});

		await auth.use('web').login(user);
		regenerateCsrfToken(ctx);

		await this.sendEmailVerificationAction.execute({ user });

		session.flash('success', this.i18n.translate('auth.session.register.success'));

		return response.redirect().toRoute('account.profile.render');
	}
}
