import { inject } from '@adonisjs/core';
import { withTransaction } from '#core/services/with_transaction';
import { FileRepository } from '#file/repositories/file_repository';
import type CmsFile from '#file/models/file';

interface MoveFilePayload {
	id: number;
	folderId: number | null;
}

/**
 * Move a file to a different folder.
 */
@inject()
export class MoveFileAction {
	constructor(protected fileRepository: FileRepository) {}

	/**
	 * Execute file move.
	 *
	 * @param payload - File ID and target folder ID (null for root).
	 * @returns The updated {@link CmsFile}.
	 */
	async execute(payload: MoveFilePayload): Promise<CmsFile> {
		const file = await this.fileRepository.findByIdOrFail(payload.id);

		return withTransaction(async () => {
			return this.fileRepository.update(file, { folderId: payload.folderId });
		});
	}
}
