import { inject } from '@adonisjs/core';
import { ListFilesQuery } from '#file/queries/list_files_query';
import type { PaginationFilters } from '#types/pagination';

interface ListFilesPayload {
	folderId?: number | null;
	mimeType?: string;
	search?: string;
	pagination: PaginationFilters;
}

/**
 * List files with optional filters (folder, MIME type, search) and pagination.
 */
@inject()
export class ListFilesAction {
	constructor(protected listFilesQuery: ListFilesQuery) {}

	/**
	 * Execute file listing.
	 *
	 * @param payload - Optional folder id, MIME type, search term, and pagination parameters.
	 * @returns A paginated result set of files with their folder and alts preloaded.
	 *
	 * @example
	 * const result = await listFilesAction.execute({ folderId: 1, pagination: { page: 1, perPage: 20 } })
	 */
	async execute(payload: ListFilesPayload) {
		return this.listFilesQuery.execute(payload);
	}
}
