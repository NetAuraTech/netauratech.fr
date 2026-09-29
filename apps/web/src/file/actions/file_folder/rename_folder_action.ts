import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import FileFolder from '#file/models/file_folder';
import { FileFolderRepository } from '#file/repositories/file_folder_repository';

interface RenameFolderPayload {
	id: number;
	name: string;
}

/**
 * Rename an existing folder.
 */
@inject()
export class RenameFolderAction {
	constructor(protected folderRepository: FileFolderRepository) {}

	/**
	 * Execute folder rename.
	 *
	 * @param payload - Folder ID and new name.
	 * @returns The updated {@link FileFolder}.
	 * @throws {RowNotFoundException} When the folder does not exist.
	 */
	async execute(payload: RenameFolderPayload): Promise<FileFolder> {
		const folder = await this.folderRepository.findById(payload.id);
		if (!folder) throw new RowNotFoundException(FileFolder);

		return withTransaction(async () => {
			return this.folderRepository.update(folder, { name: payload.name });
		});
	}
}
