import { inject } from '@adonisjs/core';
import { ListRootFoldersQuery } from '#file/queries/list_root_folders_query';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

/**
 * List the root folders of the file tree (folders with no parent).
 */
@inject()
export class ListRootFoldersAction {
	constructor(protected listRootFoldersQuery: ListRootFoldersQuery) {}

	/**
	 * Execute root folders listing.
	 *
	 * @returns The root folders ordered by name, children nested.
	 *
	 * @example
	 * const roots = await listRootFoldersAction.execute()
	 */
	async execute(): Promise<FileFolderDomain[]> {
		return this.listRootFoldersQuery.execute();
	}
}
