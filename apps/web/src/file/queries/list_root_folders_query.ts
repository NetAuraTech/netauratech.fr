import { BaseQuery } from '#core/queries/base_query';
import FileFolder from '#file/models/file_folder';
import { buildFolderForest } from '#file/queries/folder_tree';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

/**
 * Read-side query for the root folders of the file tree (folders with no
 * parent), ordered by name. Each root carries its full subtree, so the whole
 * tree is hydrated from a single query.
 */
export class ListRootFoldersQuery extends BaseQuery {
	/**
	 * Execute the root folders query.
	 *
	 * @returns The root folders ordered by name, children nested.
	 */
	async execute(): Promise<FileFolderDomain[]> {
		const rows = await FileFolder.query(this.client()).orderBy('name');

		return buildFolderForest(rows);
	}
}
