import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import Role from '#identity/models/role';
import type { Role as RoleDomain } from '#identity/domain/role';
import type { PaginationFilters } from '#types/pagination';

interface ListRolesCriteria {
	search?: string;
	pagination: PaginationFilters;
}

/**
 * Read-side query for listing roles with an optional search filter and
 * pagination, including preloaded permissions and the assigned user count.
 */
export class ListRolesQuery extends BaseQuery {
	/**
	 * Execute the role listing query.
	 *
	 * @param criteria - Optional search term and pagination parameters.
	 * @returns A paginated result set of roles with permissions preloaded and user count.
	 */
	async execute(criteria: ListRolesCriteria): Promise<PaginatedResult<RoleDomain>> {
		const query = Role.query(this.client()).preload('permissions').withCount('users').orderBy('name', 'asc');

		if (criteria.search) {
			query.where((builder) => {
				builder.whereILike('name', `%${criteria.search}%`).orWhereILike('description', `%${criteria.search}%`);
			});
		}

		const result = await query.paginate(criteria.pagination.page ?? 1, criteria.pagination.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
