import { inject } from '@adonisjs/core';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import CmsFile from '#file/models/file';
import { ListFileAltsQuery } from '#file/queries/list_file_alts_query';
import type { FileAlt as FileAltDomain } from '#file/domain/file_alt';

interface ListFileAltsPayload {
	fileId: number;
}

/**
 * List the alt entries of a file, ordered by locale then key.
 */
@inject()
export class ListFileAltsAction {
	constructor(protected listFileAltsQuery: ListFileAltsQuery) {}

	/**
	 * Execute file alts listing.
	 *
	 * @param payload - The file whose alt entries to retrieve.
	 * @returns The file's alt entries, ordered by locale then key.
	 * @throws {RowNotFoundException} When the file does not exist.
	 *
	 * @example
	 * const alts = await listFileAltsAction.execute({ fileId: 1 })
	 */
	async execute(payload: ListFileAltsPayload): Promise<FileAltDomain[]> {
		const alts = await this.listFileAltsQuery.execute(payload.fileId);

		if (alts === null) {
			throw new RowNotFoundException(CmsFile);
		}

		return alts;
	}
}
