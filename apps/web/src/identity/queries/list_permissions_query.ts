import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import Permission from '#identity/models/permission';
import type { Permission as PermissionDomain } from '#identity/domain/permission';
import type { PaginationFilters } from '#types/pagination';

interface ListPermissionsCriteria {
	search?: string;
	pagination: PaginationFilters;
}

/**
 * Read-side query for listing permissions with an optional search filter and
 * pagination.
 */
export class ListPermissionsQuery extends BaseQuery {
	/**
	 * Execute the permission listing query.
	 *
	 * @param criteria - Optional search term and pagination parameters.
	 * @returns A paginated result set of permissions.
	 */
	async execute(criteria: ListPermissionsCriteria): Promise<PaginatedResult<PermissionDomain>> {
		const query = Permission.query(this.client()).orderBy('name', 'asc');

		if (criteria.search) {
			query.where((builder) => {
				builder.whereILike('name', `%${criteria.search}%`).orWhereILike('description', `%${criteria.search}%`);
			});
		}

		const result = await query.paginate(criteria.pagination.page ?? 1, criteria.pagination.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
