import { inject } from '@adonisjs/core';
import { UpdatePreferencesAction } from '#account/actions/preferences/update_preferences_action';
import { buildPreferencesPayload } from '#transport/account/helpers/i18n_payloads/preferences';
import { updateValidator } from '#transport/account/validators/preference';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class PreferencesController {
	constructor(
		protected i18n: I18nService,
		private updatePreferencesAction: UpdatePreferencesAction,
	) {}

	async render(ctx: HttpContext) {
		const { inertia } = ctx;

		return renderInertiaPage(inertia, 'settings/preferences/front/index', {
			translations: buildPreferencesPayload(this.i18n),
		});
	}

	async execute(ctx: HttpContext): Promise<void> {
		const { request, response, auth, session } = ctx;

		const user = auth.getUserOrFail();
		const payload = await updateValidator.validate(request.all());

		await this.updatePreferencesAction.execute({ user, data: payload });

		await user.refresh();

		session.flash('success', this.i18n.translate('account.preferences.success'));

		return response.redirect().toRoute('account.preferences.render');
	}
}
