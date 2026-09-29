import { inject } from '@adonisjs/core';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { CreateRoleAction } from '#identity/actions/role/create_role_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildRolesFormPayload } from '#transport/identity/helpers/i18n_payloads/roles_form';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import { createRoleValidator } from '#transport/identity/validators/role';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class RolesCreateController {
	constructor(
		protected i18n: I18nService,
		protected createRoleAction: CreateRoleAction,
		protected listAllPermissionsAction: ListAllPermissionsAction,
	) {}

	/**
	 * Renders the role creation form with the permissions checkboxes grouped by category.
	 */
	async render(ctx: HttpContext) {
		const { inertia } = ctx;

		const permissions = await this.listAllPermissionsAction.execute();

		return renderInertiaPage(inertia, 'role/admin/form', {
			role: null,
			permissions: PermissionTransformer.transform(permissions.map((permission) => permission.toDomain())),
			translations: buildRolesFormPayload(this.i18n, permissions),
		});
	}

	/**
	 * Creates a custom role and assigns its initial permissions.
	 */
	async execute(ctx: HttpContext) {
		const { request, response, session } = ctx;

		const payload = await createRoleValidator.validate(request.all());

		const role = await this.createRoleAction.execute({
			name: payload.name,
			slug: payload.slug,
			description: payload.description ?? null,
			permissionIds: payload.permission_ids,
		});

		session.flash('success', this.i18n.translate('identity.admin.roles.flash.created'));

		return response.redirect().toRoute('admin.identity.roles_show.render', { id: role.id });
	}
}
