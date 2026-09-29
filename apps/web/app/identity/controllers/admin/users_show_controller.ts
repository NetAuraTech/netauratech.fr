import { inject } from '@adonisjs/core';
import { enabledProviders } from '#auth/oauth_providers';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { GetUserDetailAction } from '#identity/actions/user/get_user_detail_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildUsersShowPayload } from '#transport/identity/helpers/i18n_payloads/users_show';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import { showValidator } from '#transport/identity/validators/user';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Admin user detail controller: renders a single user's profile, providers
 * and permissions.
 */
@inject()
export default class UserShowController {
	constructor(
		protected i18n: I18nService,
		protected getUserDetailAction: GetUserDetailAction,
		protected listAllPermissionsAction: ListAllPermissionsAction,
	) {}

	/**
	 * Renders the detail page of the user identified by the route param.
	 */
	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		const payload = await showValidator.validate(params);

		const user = await this.getUserDetailAction.execute({ id: payload.id });

		const permissions = await this.listAllPermissionsAction.execute();

		return renderInertiaPage(inertia, 'auth/admin/show', {
			user: UserTransformer.transform(user),
			providers: enabledProviders,
			permissions: PermissionTransformer.transform(permissions.map((permission) => permission.toDomain())),
			translations: buildUsersShowPayload(this.i18n, user.role, permissions),
		});
	}
}
