import { inject } from '@adonisjs/core';
import { ListAllRolesAction } from '#identity/actions/role/list_all_roles_action';
import { CreateUserAction } from '#identity/actions/user/create_user_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { buildUsersFormPayload } from '#transport/identity/helpers/i18n_payloads/users_form';
import { roleIdsToAllowlist } from '#transport/identity/helpers/load_user_role';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import { createValidator } from '#transport/identity/validators/user';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Admin user creation controller: renders the invite form and creates the
 * pending user with its invitation mail.
 */
@inject()
export default class UsersCreateController {
	constructor(
		protected i18n: I18nService,
		protected createUserAction: CreateUserAction,
		protected listAllRolesAction: ListAllRolesAction,
	) {}

	/**
	 * Renders the user creation form with the assignable roles.
	 */
	async render(ctx: HttpContext) {
		const { inertia } = ctx;

		const roles = await this.listAllRolesAction.execute();

		return renderInertiaPage(inertia, 'auth/admin/form', {
			roles: RoleTransformer.transform(roles.map((role) => role.toDomain())),
			translations: buildUsersFormPayload(this.i18n, roles),
		});
	}

	/**
	 * Validates the invitation payload, creates the pending user and its
	 * invitation mail, then redirects to the new user's detail page.
	 */
	async execute(ctx: HttpContext) {
		const { request, response, session } = ctx;

		const roles = await this.listAllRolesAction.execute();
		const allowed = roleIdsToAllowlist(roles);

		const payload = await createValidator(allowed).validate(request.all());

		const user = await this.createUserAction.execute({
			email: payload.email,
			roleId: payload.role_id ? Number(payload.role_id) : undefined,
		});

		session.flash(
			'success',
			this.i18n.translate('identity.admin.users.created', { email: user.email, username: user.username }),
		);

		return response.redirect().toRoute('admin.identity.users_show.render', { id: user.id });
	}
}
