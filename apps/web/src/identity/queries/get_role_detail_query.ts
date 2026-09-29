import { BaseQuery } from '#core/queries/base_query';
import Role from '#identity/models/role';
import type { Role as RoleDomain } from '#identity/domain/role';

/**
 * Read-side query for a single role by primary key, preloading its permissions
 * and assigned users. Returns `null` when no role matches the id.
 */
export class GetRoleDetailQuery extends BaseQuery {
	/**
	 * Execute the role detail query.
	 *
	 * @param id - The role primary key to fetch.
	 * @returns The {@link RoleDomain} with `permissions` and `users` relations
	 *   loaded, or `null`.
	 */
	async execute(id: number): Promise<RoleDomain | null> {
		const role = await Role.query(this.client()).where('id', id).preload('permissions').preload('users').first();

		return role ? role.toDomain() : null;
	}
}
