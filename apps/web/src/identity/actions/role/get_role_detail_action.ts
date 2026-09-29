import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import Role from '#identity/models/role';
import { GetRoleDetailQuery } from '#identity/queries/get_role_detail_query';
import type { Role as RoleDomain } from '#identity/domain/role';

interface GetRoleDetailPayload {
	id: number;
}

/**
 * Fetch a single role with its permissions and assigned users preloaded.
 */
@inject()
export class GetRoleDetailAction {
	constructor(protected getRoleDetailQuery: GetRoleDetailQuery) {}

	/**
	 * Execute role detail lookup.
	 *
	 * @param payload - The role id to fetch.
	 * @returns The {@link RoleDomain} with `permissions` and `users` relations
	 *   loaded.
	 * @throws {RowNotFoundException} When the role does not exist.
	 *
	 * @example
	 * const role = await getRoleDetailAction.execute({ id: 1 })
	 */
	async execute(payload: GetRoleDetailPayload): Promise<RoleDomain> {
		const role = await this.getRoleDetailQuery.execute(payload.id);

		if (!role) {
			throw new RowNotFoundException(Role);
		}

		return role;
	}
}
