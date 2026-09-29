import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import FileFolder from '#file/models/file_folder';
import { GetFolderDetailQuery } from '#file/queries/get_folder_detail_query';
import type { FileFolder as FileFolderDomain } from '#file/domain/file_folder';

interface GetFolderDetailPayload {
	id: number;
}

/**
 * Retrieve a single folder by primary key.
 */
@inject()
export class GetFolderDetailAction {
	constructor(protected getFolderDetailQuery: GetFolderDetailQuery) {}

	/**
	 * Execute folder detail lookup.
	 *
	 * @param payload - The folder ID to retrieve.
	 * @returns The {@link FileFolderDomain} with children nested.
	 * @throws {RowNotFoundException} When no record exists for the given id.
	 *
	 * @example
	 * const folder = await getFolderDetailAction.execute({ id: 1 })
	 */
	async execute(payload: GetFolderDetailPayload): Promise<FileFolderDomain> {
		const folder = await this.getFolderDetailQuery.execute(payload.id);

		if (!folder) {
			throw new RowNotFoundException(FileFolder);
		}

		return folder;
	}
}
