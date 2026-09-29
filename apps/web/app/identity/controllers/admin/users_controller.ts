import { inject } from '@adonisjs/core';
import { DeleteUserAction } from '#identity/actions/user/delete_user_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { handle } from '#transport/core/rest/page_adapter';
import UsersResource from '#transport/identity/rest/users_resource';
import { deleteValidator } from '#transport/identity/validators/user';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class UsersController {
	constructor(
		protected i18n: I18nService,
		protected deleteUserAction: DeleteUserAction,
		protected usersResource: UsersResource,
	) {}

	async render(ctx: HttpContext) {
		return handle(ctx, this.usersResource.endpoints.index);
	}

	async destroy(ctx: HttpContext) {
		const { response, params, session } = ctx;

		const payload = await deleteValidator.validate(params);

		await this.deleteUserAction.execute({ id: payload.id });

		session.flash('success', this.i18n.translate('identity.admin.users.deleted'));

		return response.redirect().toRoute('admin.identity.users.render');
	}
}
