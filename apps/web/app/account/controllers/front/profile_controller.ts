import { inject } from '@adonisjs/core';
import { UpdateUserProfileAction } from '#account/actions/profile/update_user_profile_action';
import { buildProfilePayload } from '#transport/account/helpers/i18n_payloads/profile';
import { profileValidator } from '#transport/account/validators/profile';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Front profile page: renders the settings form and applies the user's
 * profile update (username).
 */
@inject()
export default class ProfileController {
	constructor(
		protected i18n: I18nService,
		protected updateUserProfileAction: UpdateUserProfileAction,
	) {}

	/**
	 * Renders the profile settings page for the authenticated user.
	 */
	async render(ctx: HttpContext) {
		const { inertia, auth } = ctx;

		const user = auth.user!;

		return renderInertiaPage(inertia, 'settings/profile/front/index', {
			user: UserTransformer.transform(user.toDomain()),
			translations: buildProfilePayload(this.i18n),
		});
	}

	/**
	 * Validates the submitted profile, applies the update and redirects back
	 * to the profile page with a success flash.
	 */
	async execute(ctx: HttpContext) {
		const { auth, request, response, session } = ctx;

		const user = auth.getUserOrFail();

		const payload = await profileValidator(user.id).validate(request.all());

		await this.updateUserProfileAction.execute({ user, username: payload.username });

		await user.refresh();

		session.flash('success', this.i18n.translate('account.profile.success'));

		return response.redirect().toRoute('account.profile.render');
	}
}
