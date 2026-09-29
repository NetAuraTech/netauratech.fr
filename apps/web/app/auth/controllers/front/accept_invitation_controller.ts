import { inject } from '@adonisjs/core';
import { AcceptInvitationAction } from '#auth/actions/invitation/accept_invitation_action';
import { GetInvitationAction } from '#auth/actions/invitation/get_invitation_action';
import { buildAcceptInvitationPayload } from '#transport/auth/helpers/i18n_payloads/accept_invitation';
import { acceptInvitationValidator, invitationValidator } from '#transport/auth/validators/auth';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { FullToken } from '#auth/enums/token_type';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class AcceptInvitationController {
	constructor(
		protected i18n: I18nService,
		protected getInvitationAction: GetInvitationAction,
		protected acceptInvitationAction: AcceptInvitationAction,
	) {}

	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		const payload = await invitationValidator.validate(params);
		const user = await this.getInvitationAction.execute({ token: payload.token as FullToken });

		return renderInertiaPage(inertia, 'auth/front/accept_invitation', {
			token: payload.token,
			user: UserTransformer.transform(user.toDomain()),
			translations: buildAcceptInvitationPayload(this.i18n, user.email),
		});
	}

	async execute(ctx: HttpContext) {
		const { response, request, auth, session } = ctx;

		const { token } = await invitationValidator.validate(request.only(['token']));

		const invitedUser = await this.getInvitationAction.execute({ token: token as FullToken });

		const payload = await acceptInvitationValidator(invitedUser.id).validate(request.all());

		const user = await this.acceptInvitationAction.execute({
			token: token as FullToken,
			password: payload.password,
		});

		await auth.use('web').login(user);

		session.flash('success', this.i18n.translate('auth.invitation.accepted'));

		return response.redirect().toRoute('account.index');
	}
}
