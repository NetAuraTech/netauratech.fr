import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { withTransaction } from '#core/services/with_transaction';
import FileFolder from '#file/models/file_folder';
import { FileFolderRepository } from '#file/repositories/file_folder_repository';
import { LogService } from '#log/services/log_service';

interface DeleteFolderPayload {
	id: number;
}

/**
 * Delete a folder. Files inside are NOT deleted — they are moved to root
 * via the SET NULL FK constraint.
 */
@inject()
export class DeleteFolderAction {
	constructor(
		protected folderRepository: FileFolderRepository,
		protected logService: LogService,
	) {}

	/**
	 * Execute folder deletion.
	 *
	 * @param payload - Folder ID to delete.
	 * @returns `true` when the folder is deleted successfully.
	 * @throws {RowNotFoundException} When the folder does not exist.
	 */
	async execute(payload: DeleteFolderPayload): Promise<boolean> {
		const deleted = await withTransaction(async () => {
			const folder = await this.folderRepository.findById(payload.id);
			if (!folder) throw new RowNotFoundException(FileFolder);
			return this.folderRepository.delete(payload.id);
		});

		// Log only after the deletion actually succeeded.
		this.logService.logBusiness('folder.deleted', {}, { folderId: payload.id });
		return deleted;
	}
}
