import { inject } from '@adonisjs/core';
import { ListUsersQuery } from '#identity/queries/list_users_query';
import type { PaginationFilters } from '#types/pagination';

interface ListUsersPayload {
	search?: string;
	role?: string;
	pagination: PaginationFilters;
}

/**
 * List users with optional search and role filters, including pending invitations.
 */
@inject()
export class ListUsersAction {
	constructor(protected listUsersQuery: ListUsersQuery) {}

	/**
	 * Execute user listing.
	 *
	 * @param payload - Optional search term, role filter, and pagination parameters.
	 * @returns A paginated result set of users with role and pending tokens preloaded.
	 *
	 * @example
	 * const result = await listUsersAction.execute({ search: "john", pagination: { page: 1, perPage: 20 } })
	 */
	async execute(payload: ListUsersPayload) {
		return this.listUsersQuery.execute(payload);
	}
}
