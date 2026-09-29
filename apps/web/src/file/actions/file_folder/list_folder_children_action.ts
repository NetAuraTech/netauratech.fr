import { inject } from '@adonisjs/core';
import { ListFolderChildrenQuery } from '#file/queries/list_folder_children_query';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

interface ListFolderChildrenPayload {
	parentId: number;
}

/**
 * List the direct children of a folder, ordered by name.
 */
@inject()
export class ListFolderChildrenAction {
	constructor(protected listFolderChildrenQuery: ListFolderChildrenQuery) {}

	/**
	 * Execute folder children listing.
	 *
	 * @param payload - The id of the folder whose children to retrieve.
	 * @returns The child folders ordered by name, children nested.
	 *
	 * @example
	 * const children = await listFolderChildrenAction.execute({ parentId: 1 })
	 */
	async execute(payload: ListFolderChildrenPayload): Promise<FileFolderDomain[]> {
		return this.listFolderChildrenQuery.execute(payload.parentId);
	}
}
