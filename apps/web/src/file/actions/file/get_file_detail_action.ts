import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import CmsFile from '#file/models/file';
import { GetFileDetailQuery } from '#file/queries/get_file_detail_query';
import type { File as FileDomain } from '#file/domain/file';

interface GetFileDetailPayload {
	id: number;
}

/**
 * Retrieve a single file by primary key, with its alts preloaded.
 */
@inject()
export class GetFileDetailAction {
	constructor(protected getFileDetailQuery: GetFileDetailQuery) {}

	/**
	 * Execute file detail lookup.
	 *
	 * @param payload - The file ID to retrieve.
	 * @returns The {@link FileDomain} with alts preloaded.
	 * @throws {RowNotFoundException} When no record exists for the given id.
	 *
	 * @example
	 * const file = await getFileDetailAction.execute({ id: 1 })
	 */
	async execute(payload: GetFileDetailPayload): Promise<FileDomain> {
		const file = await this.getFileDetailQuery.execute(payload.id);

		if (!file) {
			throw new RowNotFoundException(CmsFile);
		}

		return file;
	}
}
