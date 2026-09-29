import { inject } from '@adonisjs/core';
import { ConfirmEmailChangeAction } from '#account/actions/account/confirm_email_change_action';
import { FullToken } from '#auth/enums/token_type';
import { buildEmailChangePayload } from '#transport/account/helpers/i18n_payloads/email_change';
import { changeEmailValidator } from '#transport/account/validators/account';
import { regenerateCsrfToken } from '#transport/auth/helpers/crsf';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class EmailChangeController {
	constructor(
		protected i18n: I18nService,
		protected confirmEmailChangeAction: ConfirmEmailChangeAction,
	) {}

	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		return renderInertiaPage(inertia, 'settings/account/front/email_change', {
			token: params.token,
			translations: buildEmailChangePayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext) {
		const { request, response, session, auth } = ctx;

		await changeEmailValidator.validate(request.all());

		const updated = await this.confirmEmailChangeAction.execute({
			token: request.input('token') as FullToken,
		});

		if (!auth.user || auth.user.id !== updated.id) {
			await auth.use('web').login(updated);
		}

		regenerateCsrfToken(ctx);

		session.flash('success', this.i18n.translate('account.email.change.success'));

		return response.redirect().toRoute('account.account.render');
	}
}
