import { BaseQuery } from '#core/queries/base_query';
import FileFolder from '#file/models/file_folder';
import { buildFolderForest } from '#file/queries/folder_tree';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

/**
 * Read-side query for the direct children of a folder, ordered by name. Each
 * child carries its full subtree, so the whole branch is hydrated from a
 * single query.
 */
export class ListFolderChildrenQuery extends BaseQuery {
	/**
	 * Execute the folder children query.
	 *
	 * @param parentId - The id of the folder whose children to retrieve.
	 * @returns The child folders ordered by name, children nested.
	 */
	async execute(parentId: number): Promise<FileFolderDomain[]> {
		const rows = await FileFolder.query(this.client()).orderBy('name');

		return buildFolderForest(rows, parentId);
	}
}
