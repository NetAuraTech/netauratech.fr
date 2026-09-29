import { inject } from '@adonisjs/core';
import { withTransaction } from '#core/services/with_transaction';
import { FileRepository } from '#file/repositories/file_repository';

interface UpsertFileAltPayload {
	fileId: number;
	locale: string;
	key: string;
	value: string;
}

/**
 * Upsert an alternative text entry for a file.
 */
@inject()
export class UpsertFileAltAction {
	constructor(protected fileRepository: FileRepository) {}

	/**
	 * Execute alt upsert.
	 *
	 * @param payload - File ID, locale, key, and value for the alt entry.
	 */
	async execute(payload: UpsertFileAltPayload): Promise<void> {
		await this.fileRepository.findByIdOrFail(payload.fileId);

		return withTransaction(async () => {
			return this.fileRepository.upsertAlt(payload.fileId, payload.locale, payload.key, payload.value);
		});
	}
}
