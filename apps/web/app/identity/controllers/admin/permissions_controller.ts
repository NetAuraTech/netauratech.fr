import { inject } from '@adonisjs/core';
import { DeletePermissionAction } from '#identity/actions/permission/delete_permission_action';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildPermissionsListPayload } from '#transport/identity/helpers/i18n_payloads/permissions_list';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import { deletePermissionValidator } from '#transport/identity/validators/permission';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Admin permissions controller: renders the permission listing and deletes
 * custom permissions.
 */
@inject()
export default class PermissionsController {
	constructor(
		protected i18n: I18nService,
		protected listAllPermissionsAction: ListAllPermissionsAction,
		protected deletePermissionAction: DeletePermissionAction,
	) {}

	/**
	 * Renders the permissions listing page, grouped by category on the frontend.
	 */
	async render(ctx: HttpContext) {
		const { inertia } = ctx;

		const permissions = await this.listAllPermissionsAction.execute();

		return renderInertiaPage(inertia, 'permission/admin/index', {
			permissions: PermissionTransformer.transform(permissions.map((permission) => permission.toDomain())),
			translations: buildPermissionsListPayload(this.i18n, permissions),
		});
	}

	/**
	 * Deletes a custom permission, revoking it from every role via the pivot cascade.
	 */
	async destroy(ctx: HttpContext) {
		const { response, params, session } = ctx;

		const payload = await deletePermissionValidator.validate(params);

		await this.deletePermissionAction.execute({ id: payload.id });

		session.flash('success', this.i18n.translate('identity.admin.permissions.flash.deleted'));

		return response.redirect().toRoute('admin.identity.permissions.render');
	}
}
