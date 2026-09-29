import { BaseQuery } from '#core/queries/base_query';
import FileFolder from '#file/models/file_folder';
import { buildFolderForest, findFolder } from '#file/queries/folder_tree';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

/**
 * Read-side query for a single folder by primary key, with its full subtree
 * hydrated from a single query. Returns `null` when no folder matches the id.
 */
export class GetFolderDetailQuery extends BaseQuery {
	/**
	 * Execute the folder detail query.
	 *
	 * @param id - The folder primary key to retrieve.
	 * @returns The {@link FileFolderDomain} with children nested, or `null`.
	 */
	async execute(id: number): Promise<FileFolderDomain | null> {
		const rows = await FileFolder.query(this.client()).orderBy('name');

		return findFolder(buildFolderForest(rows), id);
	}
}
