import { inject } from '@adonisjs/core';
import { UpdatePreferencesAction } from '#account/actions/preferences/update_preferences_action';
import { updateValidator } from '#transport/account/validators/preference';
import { I18nService } from '#transport/core/helpers/i18n_service';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class PreferencesController {
	constructor(
		protected i18n: I18nService,
		private updatePreferencesAction: UpdatePreferencesAction,
	) {}

	async execute(ctx: HttpContext) {
		const { request, response, auth, session } = ctx;

		const user = auth.getUserOrFail();
		const payload = await updateValidator.validate(request.all());

		await this.updatePreferencesAction.execute({ user, data: payload });

		await user.refresh();

		session.flash('success', this.i18n.translate('account.preferences.success'));

		return response.ok(this.i18n.translate('account.preferences.theme.success'));
	}
}
