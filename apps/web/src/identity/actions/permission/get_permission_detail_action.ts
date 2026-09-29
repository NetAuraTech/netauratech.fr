import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import Permission from '#identity/models/permission';
import { PermissionRepository } from '#identity/repositories/permission_repository';

interface GetPermissionDetailPayload {
	id: number;
}

/**
 * Fetch a single permission by id.
 */
@inject()
export class GetPermissionDetailAction {
	constructor(protected permissionRepository: PermissionRepository) {}

	/**
	 * Execute permission detail lookup.
	 *
	 * @param payload - The permission id to fetch.
	 * @returns The matching permission.
	 * @throws {RowNotFoundException} When the permission does not exist.
	 *
	 * @example
	 * const permission = await getPermissionDetailAction.execute({ id: 1 })
	 */
	async execute(payload: GetPermissionDetailPayload): Promise<Permission> {
		const permission = await this.permissionRepository.findById(payload.id);

		if (!permission) {
			throw new RowNotFoundException(Permission);
		}

		return permission;
	}
}
