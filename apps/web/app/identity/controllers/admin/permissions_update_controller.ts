import { inject } from '@adonisjs/core';
import { GetPermissionDetailAction } from '#identity/actions/permission/get_permission_detail_action';
import { UpdatePermissionAction } from '#identity/actions/permission/update_permission_action';
import SystemPermissionImmutableException from '#identity/exceptions/system_permission_immutable_exception';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildPermissionsFormPayload } from '#transport/identity/helpers/i18n_payloads/permissions_form';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';
import { editPermissionValidator, updatePermissionValidator } from '#transport/identity/validators/permission';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class PermissionsUpdateController {
	constructor(
		protected i18n: I18nService,
		protected updatePermissionAction: UpdatePermissionAction,
		protected getPermissionDetailAction: GetPermissionDetailAction,
	) {}

	/**
	 * Renders the permission edit form. System permissions are rejected before rendering.
	 */
	async render(ctx: HttpContext) {
		const { inertia, params } = ctx;

		const payload = await editPermissionValidator.validate(params);

		const permission = await this.getPermissionDetailAction.execute({ id: payload.id });

		if (permission.isSystem) {
			throw new SystemPermissionImmutableException(permission.slug);
		}

		return renderInertiaPage(inertia, 'permission/admin/form', {
			permission: PermissionTransformer.transform(permission.toDomain()),
			translations: buildPermissionsFormPayload(this.i18n),
		});
	}

	/**
	 * Updates a custom permission.
	 */
	async execute(ctx: HttpContext) {
		const { request, response, session, params } = ctx;

		const { id } = await editPermissionValidator.validate(params);
		const payload = await updatePermissionValidator(id).validate(request.all());

		await this.updatePermissionAction.execute({
			id,
			name: payload.name,
			slug: payload.slug,
			category: payload.category,
			description: payload.description ?? null,
		});

		session.flash('success', this.i18n.translate('identity.admin.permissions.flash.updated'));

		return response.redirect().toRoute('admin.identity.permissions.render');
	}
}
