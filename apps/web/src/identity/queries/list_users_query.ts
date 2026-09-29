import { DateTime } from 'luxon';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import User from '#identity/models/user';
import type { User as UserDomain } from '#identity/domain/user';
import type { PaginationFilters } from '#types/pagination';

interface ListUsersCriteria {
	search?: string;
	role?: string;
	pagination: PaginationFilters;
}

/**
 * Read-side query for listing users with optional search and role filters,
 * including pending invitations. Returns a paginated result set of users with
 * their role and pending-invite tokens preloaded.
 */
export class ListUsersQuery extends BaseQuery {
	/**
	 * Execute the user listing query.
	 *
	 * @param criteria - Optional search term, role filter, and pagination parameters.
	 * @returns A paginated result set of users with role and pending tokens preloaded.
	 */
	async execute(criteria: ListUsersCriteria): Promise<PaginatedResult<UserDomain>> {
		const query = User.query(this.client())
			.preload('role')
			.preload('tokens', (q) => {
				q.where('type', TOKEN_TYPES.PENDING_INVITE).where('expires_at', '>', DateTime.now().toSQL());
			})
			.orderBy('created_at', 'desc');

		if (criteria.search) {
			query.where((builder) => {
				builder.whereILike('email', `%${criteria.search}%`).orWhereILike('username', `%${criteria.search}%`);
			});
		}

		if (criteria.role) {
			query.where('role_id', criteria.role);
		}

		const result = await query.paginate(criteria.pagination.page ?? 1, criteria.pagination.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
