import { inject } from '@adonisjs/core';
import { TwoFactorService } from '#auth/services/two_factor_service';
import { UserRepository } from '#identity/repositories/user_repository';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { buildTwoFactorPayload } from '#transport/auth/helpers/i18n_payloads/two_factor';
import { twoFactorCodeValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Front (Inertia) controller for the login-time TOTP challenge.
 *
 * Sits between a successful password check and session establishment: the
 * {@link SessionController} parks the pending user in the session and hands
 * the visitor here, and {@link verify} only opens the session once a valid
 * code is supplied. Guests with no pending challenge are sent back to login.
 */
@inject()
export default class TwoFactorController {
	constructor(
		protected i18n: I18nService,
		protected userRepository: UserRepository,
		protected twoFactorService: TwoFactorService,
	) {}

	/**
	 * GET /two-factor — render the code-entry challenge.
	 */
	async render(ctx: HttpContext) {
		const { inertia, session, response } = ctx;

		const pendingId = session.get('twoFactorUserId');
		const user = pendingId ? await this.userRepository.findById(pendingId) : null;

		if (!user) {
			session.forget('twoFactorUserId');
			session.forget('twoFactorRemember');
			return response.redirect().toRoute('auth.session.render');
		}

		return renderInertiaPage(inertia, 'auth/front/two_factor', {
			pendingEmail: user.email,
			translations: buildTwoFactorPayload(this.i18n),
		});
	}

	/**
	 * POST /two-factor — verify the entered code and, on success, establish
	 * the session (honouring the remembered "keep me signed in" choice).
	 */
	async verify(ctx: HttpContext) {
		const { request, session, auth, response } = ctx;

		const pendingId = session.get('twoFactorUserId');
		const user = pendingId ? await this.userRepository.findById(pendingId) : null;

		if (!user) {
			session.forget('twoFactorUserId');
			session.forget('twoFactorRemember');
			return response.redirect().toRoute('auth.session.render');
		}

		const payload = await twoFactorCodeValidator.validate(request.all());
		// Throws (and flashes) an InvalidTwoFactorCodeException on a bad code.
		await this.twoFactorService.verifyLoginCode(user, payload.code);

		const remember = !!session.get('twoFactorRemember');
		await auth.use('web').login(user, remember);
		regenerateCsrfToken(ctx);

		session.forget('twoFactorUserId');
		session.forget('twoFactorRemember');
		session.flash('success', this.i18n.translate('auth.session.login.success'));

		return response.redirect().toRoute('account.profile.render');
	}
}
