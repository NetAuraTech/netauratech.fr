import { inject } from '@adonisjs/core';
import { type Infer } from '@vinejs/vine/types';
import { ListAllRolesAction } from '#identity/actions/role/list_all_roles_action';
import { CreateUserAction } from '#identity/actions/user/create_user_action';
import { DeleteUserAction } from '#identity/actions/user/delete_user_action';
import { GetUserDetailAction } from '#identity/actions/user/get_user_detail_action';
import { ListUsersAction } from '#identity/actions/user/list_users_action';
import { UpdateUserAction } from '#identity/actions/user/update_user_action';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import { buildUsersFormPayload } from '#transport/identity/helpers/i18n_payloads/users_form';
import { buildUsersListPayload } from '#transport/identity/helpers/i18n_payloads/users_list';
import { roleIdsToAllowlist } from '#transport/identity/helpers/load_user_role';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import UserTransformer from '#transport/identity/transformers/user_transformer';
import {
	listValidator,
	editValidator,
	createValidator,
	updateValidator,
	restIdValidator,
} from '#transport/identity/validators/user';
import type { User } from '#identity/domain/user';
import type Role from '#identity/models/role';

type UserListPagination = Awaited<ReturnType<ListUsersAction['execute']>>;
type UserCreateResult = Awaited<ReturnType<CreateUserAction['execute']>>;
type UserUpdateResult = Awaited<ReturnType<UpdateUserAction['execute']>>;
type UserDeleteResult = Awaited<ReturnType<DeleteUserAction['execute']>>;

/**
 * Endpoint declarations for the users resource.
 *
 * Each member is a {@link RestEndpoint} instantiation: `Prepared` is the
 * value produced by the `prepare` step, `Payload` is inferred from the Vine
 * validator, `Result` is the domain action return and `Entity` is what the
 * transformer consumes. The REST adapter and the page adapter both consume
 * the same declarations.
 */
export interface UsersEndpoints {
	index: RestEndpoint<
		{ roles: Role[]; allowed: string[] },
		Infer<ReturnType<typeof listValidator>>,
		UserListPagination,
		UserListPagination
	>;
	show: RestEndpoint<undefined, Infer<typeof restIdValidator>, User, User>;
	store: RestEndpoint<{ allowed: string[] }, Infer<ReturnType<typeof createValidator>>, UserCreateResult, User>;
	edit: RestEndpoint<{ roles: Role[] }, Infer<typeof editValidator>, User, User>;
	update: RestEndpoint<
		{ id: number; allowed: string[] },
		Infer<ReturnType<typeof updateValidator>>,
		UserUpdateResult,
		User
	>;
	destroy: RestEndpoint<undefined, Infer<typeof restIdValidator>, UserDeleteResult, UserDeleteResult>;
}

/**
 * Declarative users resource.
 *
 * Owns the users endpoint declarations consumed by the `handle` adapters:
 * the REST `handle` (`#transport/core/rest/rest_adapter`) for the `/api/v1/admin/users`
 * routes and the page `handle` (`#transport/core/rest/page_adapter`) for the
 * session-rendered admin pages (list, edit form, update). The request
 * interpretation — roles allowlist, field coercions — exists exactly once,
 * in these declarations.
 */
@inject()
export default class UsersResource {
	constructor(
		protected i18n: I18nService,
		protected listUsersAction: ListUsersAction,
		protected listAllRolesAction: ListAllRolesAction,
		protected getUserDetailAction: GetUserDetailAction,
		protected createUserAction: CreateUserAction,
		protected updateUserAction: UpdateUserAction,
		protected deleteUserAction: DeleteUserAction,
	) {}

	/**
	 * Shared serialization shape for the paginated user list, consumed by
	 * both the REST transform and the page render.
	 */
	private readonly paginateUsers = (users: UserListPagination) =>
		UserTransformer.paginate(users.all(), users.getMeta());

	readonly endpoints: UsersEndpoints = {
		index: {
			paginated: true,
			strip: true,
			prepare: async () => {
				const roles = await this.listAllRolesAction.execute();

				return { roles, allowed: roleIdsToAllowlist(roles) };
			},
			validator: (prepared) => listValidator(prepared.allowed),
			execute: (context, _prepared, payload) =>
				this.listUsersAction.execute({
					search: payload.search,
					role: payload.role,
					pagination: context.pagination!,
				}),
			transform: (entity) => this.paginateUsers(entity),
			page: {
				component: 'auth/admin/index',
				render: async (_context, prepared, payload, result) => ({
					users: this.paginateUsers(result),
					roles: RoleTransformer.transform(prepared.roles.map((role) => role.toDomain())),
					filters: payload,
					translations: buildUsersListPayload(this.i18n, prepared.roles),
				}),
			},
		},
		show: {
			input: (context) => context.params,
			validator: () => restIdValidator,
			execute: (_context, _prepared, payload) => this.getUserDetailAction.execute({ id: payload.id }),
			transform: (entity) => UserTransformer.transform(entity),
		},
		store: {
			status: 201,
			prepare: async () => {
				const roles = await this.listAllRolesAction.execute();

				return { allowed: roleIdsToAllowlist(roles) };
			},
			validator: (prepared) => createValidator(prepared.allowed),
			execute: (_context, _prepared, payload) =>
				this.createUserAction.execute({
					email: payload.email,
					roleId: payload.role_id ? Number(payload.role_id) : undefined,
				}),
			refetch: (_context, _prepared, _payload, created) => this.getUserDetailAction.execute({ id: created.id }),
			transform: (entity) => UserTransformer.transform(entity),
		},
		edit: {
			input: (context) => context.params,
			prepare: async () => ({ roles: await this.listAllRolesAction.execute() }),
			validator: () => editValidator,
			execute: (_context, _prepared, payload) => this.getUserDetailAction.execute({ id: payload.id }),
			page: {
				component: 'auth/admin/form',
				render: async (_context, prepared, _payload, user) => ({
					user: UserTransformer.transform(user),
					roles: RoleTransformer.transform(prepared.roles.map((role) => role.toDomain())),
					translations: buildUsersFormPayload(this.i18n, prepared.roles),
				}),
			},
		},
		update: {
			prepare: async (context) => {
				const { id } = await restIdValidator.validate(context.params);
				const roles = await this.listAllRolesAction.execute();

				return { id, allowed: roleIdsToAllowlist(roles) };
			},
			validator: (prepared) => updateValidator(prepared.id, prepared.allowed),
			execute: (_context, prepared, payload) =>
				this.updateUserAction.execute({
					id: prepared.id,
					email: payload.email,
					username: payload.username,
					roleId: payload.role_id ? Number(payload.role_id) : undefined,
					apiRateLimit: payload.api_rate_limit,
				}),
			refetch: (_context, prepared) => this.getUserDetailAction.execute({ id: prepared.id }),
			transform: (entity) => UserTransformer.transform(entity),
			page: {
				flash: (_context, _prepared, payload, result) => {
					let message = this.i18n.translate('identity.admin.users.updated');

					if (result?.pendingEmail === payload.email) {
						message = `${message} ${this.i18n.translate('identity.admin.users.updated_email')}`;
					}

					return message;
				},
				redirect: (_context, prepared) => ({
					route: 'admin.identity.users_show.render',
					params: { id: prepared.id },
				}),
			},
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => restIdValidator,
			execute: (_context, _prepared, payload) => this.deleteUserAction.execute({ id: payload.id }),
		},
	};
}
