import { inject } from '@adonisjs/core';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { GetRoleDetailAction } from '#identity/actions/role/get_role_detail_action';
import { UpdateRoleAction } from '#identity/actions/role/update_role_action';
import SystemRoleImmutableException from '#identity/exceptions/system_role_immutable_exception';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildRolesFormPayload } from '#transport/identity/helpers/i18n_payloads/roles_form';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import { editRoleValidator, updateRoleValidator } from '#transport/identity/validators/role';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class RolesUpdateController {
	constructor(
		protected i18n: I18nService,
		protected updateRoleAction: UpdateRoleAction,
		protected getRoleDetailAction: GetRoleDetailAction,
		protected listAllPermissionsAction: ListAllPermissionsAction,
	) {}

	/**
	 * Renders the role edit form. System roles are rejected before rendering.
	 */
	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		const payload = await editRoleValidator.validate(params);

		const role = await this.getRoleDetailAction.execute({ id: payload.id });

		if (!role.canBeModified()) {
			throw new SystemRoleImmutableException(role.slug);
		}

		const permissions = await this.listAllPermissionsAction.execute();

		return renderInertiaPage(inertia, 'role/admin/form', {
			role: RoleTransformer.transform(role),
			permissions: PermissionTransformer.transform(permissions.map((permission) => permission.toDomain())),
			translations: buildRolesFormPayload(this.i18n, permissions),
		});
	}

	/**
	 * Updates a custom role and syncs its permissions.
	 */
	async execute(ctx: HttpContext) {
		const { request, response, session, params } = ctx;

		const { id } = await editRoleValidator.validate(params);
		const payload = await updateRoleValidator(id).validate(request.all());

		await this.updateRoleAction.execute({
			id,
			name: payload.name,
			slug: payload.slug,
			description: payload.description ?? null,
			permissionIds: payload.permission_ids,
		});

		session.flash('success', this.i18n.translate('identity.admin.roles.flash.updated'));

		return response.redirect().toRoute('admin.identity.roles_show.render', { id });
	}
}
