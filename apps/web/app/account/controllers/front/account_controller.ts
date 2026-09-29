import { inject } from '@adonisjs/core';
import { Exception } from '@adonisjs/core/exceptions';
import { DeleteUserAccountAction } from '#account/actions/account/delete_user_account_action';
import { UpdateUserAccountAction } from '#account/actions/account/update_user_account_action';
import { enabledProviders } from '#auth/oauth_providers';
import { TwoFactorService } from '#auth/services/two_factor_service';
import { buildAccountPayload } from '#transport/account/helpers/i18n_payloads/account';
import {
	deleteAccountValidator,
	disableTwoFactorValidator,
	updateEmailValidator,
	updatePasswordValidator,
} from '#transport/account/validators/account';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { twoFactorCodeValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class AccountController {
	constructor(
		protected i18n: I18nService,
		protected updateUserAccountAction: UpdateUserAccountAction,
		protected deleteUserAccountAction: DeleteUserAccountAction,
		protected twoFactorService: TwoFactorService,
	) {}

	async render(ctx: HttpContext) {
		const { inertia, auth, session } = ctx;

		const user = auth.user!;

		const pendingSecret = session.get('twoFactorPendingSecret');

		return renderInertiaPage(inertia, 'settings/account/front/index', {
			user: UserTransformer.transform(user.toDomain()),
			providers: enabledProviders,
			twoFactorEnabled: !!user.twoFactorEnabled,
			twoFactorRecoveryCodes: user.twoFactorEnabled ? this.twoFactorService.getRecoveryCodes(user) : [],
			twoFactorPending: pendingSecret
				? { secret: pendingSecret, otpauthUri: session.get('twoFactorPendingOtpauthUri') }
				: null,
			translations: buildAccountPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { auth, request, response, session } = ctx;

		const action = request.input('_action');

		const user = auth.getUserOrFail();

		switch (action) {
			case 'update_email': {
				const payload = await updateEmailValidator(user.id).validate(request.all());

				const updated = await this.updateUserAccountAction.execute({ user, email: payload.email });

				regenerateCsrfToken(ctx);

				if (payload.email === updated.pendingEmail) {
					session.flash('success', this.i18n.translate('account.account.success'));
				}

				return response.redirect().toRoute('account.account.render');
			}
			case 'update_password': {
				const payload = await updatePasswordValidator.validate(request.all());

				await this.updateUserAccountAction.execute({
					user,
					currentPassword: payload.current_password,
					password: payload.password,
				});

				regenerateCsrfToken(ctx);

				session.flash('success', this.i18n.translate('account.account.password.success'));

				return response.redirect().toRoute('account.account.render');
			}
			case 'begin_2fa': {
				const { secret, otpauthUri } = this.twoFactorService.beginEnrollment(user);

				session.put('twoFactorPendingSecret', secret);
				session.put('twoFactorPendingOtpauthUri', otpauthUri);

				return response.redirect().toRoute('account.account.render');
			}
			case 'confirm_2fa': {
				const pendingSecret = session.get('twoFactorPendingSecret');

				if (!pendingSecret) {
					throw new Exception('', { status: 400 });
				}

				const payload = await twoFactorCodeValidator.validate(request.all());

				await this.twoFactorService.confirmEnrollment(user, payload.code, pendingSecret);

				session.forget('twoFactorPendingSecret');
				session.forget('twoFactorPendingOtpauthUri');

				regenerateCsrfToken(ctx);

				session.flash('success', this.i18n.translate('account.account.two_factor.success'));

				return response.redirect().toRoute('account.account.render');
			}
			case 'cancel_2fa': {
				session.forget('twoFactorPendingSecret');
				session.forget('twoFactorPendingOtpauthUri');

				return response.redirect().toRoute('account.account.render');
			}
			case 'disable_2fa': {
				const payload = await disableTwoFactorValidator.validate(request.all());

				await this.twoFactorService.disableTwoFactor(user, payload.current_password, payload.code);

				regenerateCsrfToken(ctx);

				session.flash('success', this.i18n.translate('account.account.two_factor.disable.success'));

				return response.redirect().toRoute('account.account.render');
			}
			default:
				throw new Exception('', { status: 400 });
		}
	}

	async destroy(ctx: HttpContext) {
		const { auth, request, response, session } = ctx;

		const user = auth.getUserOrFail();

		const payload = await deleteAccountValidator.validate(request.all());

		await this.deleteUserAccountAction.execute({ user, password: payload.password });

		await auth.use('web').logout();

		session.flash('success', this.i18n.translate('account.password.delete.success'));

		return response.redirect().toRoute('auth.session.render');
	}
}
