import { inject } from '@adonisjs/core';
import { LoginAction } from '#auth/actions/session/login_action';
import { LogoutAction } from '#auth/actions/session/logout_action';
import { enabledProviders } from '#auth/oauth_providers';
import { LogService } from '#log/services/log_service';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { buildSessionPayload } from '#transport/auth/helpers/i18n_payloads/session';
import { loginValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class SessionController {
	constructor(
		protected i18n: I18nService,
		protected loginAction: LoginAction,
		protected logoutAction: LogoutAction,
		protected logService: LogService,
	) {}

	render(ctx: HttpContext) {
		const { inertia } = ctx;

		return renderInertiaPage(inertia, 'auth/front/login', {
			providers: enabledProviders,
			translations: buildSessionPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { request, response, session, auth } = ctx;

		const payload = await loginValidator.validate(request.all());

		const user = await this.loginAction.execute({
			email: payload.email,
			password: payload.password,
		});

		// When 2FA is enabled the password is only the first factor: park the
		// pending user in the session and hand the visitor the TOTP challenge
		// without establishing a session yet.
		if (user.twoFactorEnabled) {
			session.put('twoFactorUserId', user.id);
			session.put('twoFactorRemember', !!payload.remember_me);

			this.logService.logAuth('login.two_factor_required', {
				userId: user.id,
				userEmail: user.email,
			});

			return response.redirect().toRoute('auth.two_factor.render');
		}

		await auth.use('web').login(user, payload.remember_me);
		regenerateCsrfToken(ctx);

		session.flash('success', this.i18n.translate('auth.session.login.success'));

		return response.redirect().toRoute('account.profile.render');
	}

	async destroy(ctx: HttpContext) {
		const { auth, response, session } = ctx;

		const user = auth.user;

		await auth.use('web').logout();

		if (user) {
			await this.logoutAction.execute({ userId: user.id, userEmail: user.email });
		}

		session.flash('success', this.i18n.translate('auth.session.logout.success'));

		return response.redirect().toRoute('auth.session.render');
	}
}
