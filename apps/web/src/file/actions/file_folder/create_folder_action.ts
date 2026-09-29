import { inject } from '@adonisjs/core';
import { withTransaction } from '#core/services/with_transaction';
import FileFolder from '#file/models/file_folder';
import { FileFolderRepository } from '#file/repositories/file_folder_repository';
import { LogService } from '#log/services/log_service';

interface CreateFolderPayload {
	name: string;
	parentId?: number | null;
}

/**
 * Create a new folder in the file system.
 */
@inject()
export class CreateFolderAction {
	constructor(
		protected folderRepository: FileFolderRepository,
		protected logService: LogService,
	) {}

	/**
	 * Execute folder creation.
	 *
	 * @param payload - Folder name and optional parent ID.
	 * @returns The newly created {@link FileFolder}.
	 */
	async execute(payload: CreateFolderPayload): Promise<FileFolder> {
		const folder = await withTransaction(async () => {
			return this.folderRepository.create({
				name: payload.name,
				parentId: payload.parentId ?? null,
			});
		});

		this.logService.logBusiness('folder.created', {}, { folderId: folder.id, name: folder.name });

		return folder;
	}
}
