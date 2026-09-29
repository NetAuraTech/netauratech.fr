import { inject } from '@adonisjs/core';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import PermissionTransformer from '#transport/identity/transformers/permission_transformer';

type PermissionListResult = Awaited<ReturnType<ListAllPermissionsAction['execute']>>;

/**
 * Endpoint declarations for the permissions REST resource (read-only).
 */
export interface PermissionsEndpoints {
	index: RestEndpoint<undefined, unknown, PermissionListResult, PermissionListResult>;
}

/**
 * Declarative permissions REST resource.
 *
 * Owns the read-only permissions endpoint declarations consumed by the REST
 * `handle` adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/permissions`
 * controller reduces to a one-line dispatch over `endpoints`.
 */
@inject()
export default class PermissionsResource {
	constructor(protected listAllPermissionsAction: ListAllPermissionsAction) {}

	readonly endpoints: PermissionsEndpoints = {
		index: {
			execute: () => this.listAllPermissionsAction.execute(),
			transform: (entity) => PermissionTransformer.transform(entity.map((permission) => permission.toDomain())),
		},
	};
}
