import { inject } from '@adonisjs/core';
import { ListPermissionsQuery } from '#identity/queries/list_permissions_query';
import type { PaginationFilters } from '#types/pagination';

interface ListPermissionsPayload {
	search?: string;
	pagination: PaginationFilters;
}

/**
 * List permissions with optional search filter and pagination.
 */
@inject()
export class ListPermissionsAction {
	constructor(protected listPermissionsQuery: ListPermissionsQuery) {}

	/**
	 * Execute permission listing.
	 *
	 * @param payload - Optional search term and pagination parameters.
	 * @returns A paginated result set of permissions.
	 *
	 * @example
	 * const result = await listPermissionsAction.execute({ search: 'user', pagination: { page: 1, perPage: 20 } })
	 */
	async execute(payload: ListPermissionsPayload) {
		return this.listPermissionsQuery.execute(payload);
	}
}
