import { inject } from '@adonisjs/core';
import { CreateRoleAction } from '#identity/actions/role/create_role_action';
import { DeleteRoleAction } from '#identity/actions/role/delete_role_action';
import { GetRoleDetailAction } from '#identity/actions/role/get_role_detail_action';
import { ListRolesAction } from '#identity/actions/role/list_roles_action';
import { UpdateRoleAction } from '#identity/actions/role/update_role_action';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import RoleTransformer from '#transport/identity/transformers/role_transformer';
import {
	listRolesValidator,
	createRoleValidator,
	updateRoleValidator,
	restRoleIdValidator,
} from '#transport/identity/validators/role';
import type { Role } from '#identity/domain/role';
import type { Infer } from '@vinejs/vine/types';

type RoleListPagination = Awaited<ReturnType<ListRolesAction['execute']>>;
type RoleCreateResult = Awaited<ReturnType<CreateRoleAction['execute']>>;
type RoleUpdateResult = Awaited<ReturnType<UpdateRoleAction['execute']>>;
type RoleDeleteResult = Awaited<ReturnType<DeleteRoleAction['execute']>>;

type RoleListPayload = Infer<typeof listRolesValidator>;
type RoleCreatePayload = Infer<typeof createRoleValidator>;
type RoleUpdatePayload = Infer<ReturnType<typeof updateRoleValidator>>;

/**
 * Endpoint declarations for the roles REST resource.
 */
export interface RolesEndpoints {
	index: RestEndpoint<undefined, RoleListPayload, RoleListPagination, RoleListPagination>;
	show: RestEndpoint<undefined, Infer<typeof restRoleIdValidator>, Role, Role>;
	store: RestEndpoint<undefined, RoleCreatePayload, RoleCreateResult, Role>;
	update: RestEndpoint<{ id: number }, RoleUpdatePayload, RoleUpdateResult, Role>;
	destroy: RestEndpoint<undefined, Infer<typeof restRoleIdValidator>, RoleDeleteResult, RoleDeleteResult>;
}

/**
 * Declarative roles REST resource.
 *
 * Owns the five roles REST endpoint declarations consumed by the REST
 * `handle` adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/roles`
 * controllers reduce to one-line dispatch over `endpoints`.
 */
@inject()
export default class RolesResource {
	constructor(
		protected listRolesAction: ListRolesAction,
		protected getRoleDetailAction: GetRoleDetailAction,
		protected createRoleAction: CreateRoleAction,
		protected updateRoleAction: UpdateRoleAction,
		protected deleteRoleAction: DeleteRoleAction,
	) {}

	readonly endpoints: RolesEndpoints = {
		index: {
			paginated: true,
			strip: true,
			validator: () => listRolesValidator,
			execute: (_context, _prepared, payload) =>
				this.listRolesAction.execute({
					search: payload.search,
					pagination: _context.pagination!,
				}),
			transform: (entity) => RoleTransformer.paginate(entity.all(), entity.getMeta()),
		},
		show: {
			input: (context) => context.params,
			validator: () => restRoleIdValidator,
			execute: (_context, _prepared, payload) => this.getRoleDetailAction.execute({ id: payload.id }),
			transform: (entity) => RoleTransformer.transform(entity),
		},
		store: {
			status: 201,
			validator: () => createRoleValidator,
			execute: (_context, _prepared, payload) =>
				this.createRoleAction.execute({
					name: payload.name,
					slug: payload.slug,
					description: payload.description ?? null,
					permissionIds: payload.permission_ids,
				}),
			refetch: (_context, _prepared, _payload, created) => this.getRoleDetailAction.execute({ id: created.id }),
			transform: (entity) => RoleTransformer.transform(entity),
		},
		update: {
			prepare: async (context) => {
				const { id } = await restRoleIdValidator.validate(context.params);

				return { id };
			},
			validator: (prepared) => updateRoleValidator(prepared.id),
			execute: (_context, prepared, payload) =>
				this.updateRoleAction.execute({
					id: prepared.id,
					name: payload.name,
					slug: payload.slug,
					description: payload.description ?? null,
					permissionIds: payload.permission_ids,
				}),
			refetch: (_context, prepared) => this.getRoleDetailAction.execute({ id: prepared.id }),
			transform: (entity) => RoleTransformer.transform(entity),
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => restRoleIdValidator,
			execute: (_context, _prepared, payload) => this.deleteRoleAction.execute({ id: payload.id }),
		},
	};
}
