import { inject } from '@adonisjs/core';
import { ListRolesQuery } from '#identity/queries/list_roles_query';
import type { PaginationFilters } from '#types/pagination';

interface ListRolesPayload {
	search?: string;
	pagination: PaginationFilters;
}

/**
 * List roles with optional search filter and pagination, including permission and user counts.
 */
@inject()
export class ListRolesAction {
	constructor(protected listRolesQuery: ListRolesQuery) {}

	/**
	 * Execute role listing.
	 *
	 * @param payload - Optional search term and pagination parameters.
	 * @returns A paginated result set of roles with permissions preloaded and user count.
	 *
	 * @example
	 * const result = await listRolesAction.execute({ search: 'admin', pagination: { page: 1, perPage: 20 } })
	 */
	async execute(payload: ListRolesPayload) {
		return this.listRolesQuery.execute(payload);
	}
}
