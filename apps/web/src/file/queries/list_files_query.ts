import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import CmsFile from '#file/models/file';
import type { File as FileDomain } from '#file/domain/file';
import type { PaginationFilters } from '#types/pagination';

interface ListFilesCriteria {
	folderId?: number | null;
	mimeType?: string;
	search?: string;
	disk?: string;
	pagination: PaginationFilters;
}

/**
 * Read-side query for listing files with optional filters (folder, MIME type,
 * search, disk) and pagination, preloading the parent folder and alt entries.
 */
export class ListFilesQuery extends BaseQuery {
	/**
	 * Execute the file listing query.
	 *
	 * @param criteria - Optional filter and pagination parameters.
	 * @returns A paginated result set of files with folder and alts preloaded.
	 */
	async execute(criteria: ListFilesCriteria): Promise<PaginatedResult<FileDomain>> {
		const query = CmsFile.query(this.client()).preload('folder').preload('alts').orderBy('created_at', 'desc');

		if (criteria.folderId !== undefined) {
			if (criteria.folderId === null) {
				query.whereNull('folder_id');
			} else {
				query.where('folder_id', criteria.folderId);
			}
		}

		if (criteria.mimeType) {
			query.whereLike('mime_type', `${criteria.mimeType}%`);
		}

		if (criteria.search) {
			query.whereILike('original_name', `%${criteria.search}%`);
		}

		if (criteria.disk) {
			query.where('disk', criteria.disk);
		}

		const result = await query.paginate(criteria.pagination.page ?? 1, criteria.pagination.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
