import { inject } from '@adonisjs/core';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { GetRoleDetailAction } from '#identity/actions/role/get_role_detail_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildRolesShowPayload } from '#transport/identity/helpers/i18n_payloads/roles_show';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import { showRoleValidator } from '#transport/identity/validators/role';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class RolesShowController {
	constructor(
		protected getRoleDetailAction: GetRoleDetailAction,
		protected listAllPermissionsAction: ListAllPermissionsAction,
		protected i18nService: I18nService,
	) {}

	/**
	 * Renders the role detail page with its users and permissions grouped by category.
	 */
	async render(ctx: HttpContext) {
		const { id } = await showRoleValidator.validate(ctx.params);

		const role = await this.getRoleDetailAction.execute({ id });
		const permissions = await this.listAllPermissionsAction.execute();

		return renderInertiaPage(ctx.inertia, 'role/admin/show', {
			role: RoleTransformer.transform(role),
			translations: buildRolesShowPayload(this.i18nService, role, permissions),
		});
	}
}
