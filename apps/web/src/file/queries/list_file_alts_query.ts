import { BaseQuery } from '#core/queries/base_query';
import CmsFile from '#file/models/file';
import FileAlt from '#file/models/file_alt';
import type { FileAlt as FileAltDomain } from '#file/domain/file_alt';

/**
 * Read-side query for the alt entries of a file, ordered by locale then key.
 * Returns `null` when no file matches the id.
 */
export class ListFileAltsQuery extends BaseQuery {
	/**
	 * Execute the file alts query.
	 *
	 * @param fileId - The file whose alt entries to retrieve.
	 * @returns The ordered alt entries, or `null` when the file does not exist.
	 */
	async execute(fileId: number): Promise<FileAltDomain[] | null> {
		const file = await CmsFile.find(fileId, this.client());

		if (!file) {
			return null;
		}

		const alts = await FileAlt.query(this.client()).where('file_id', fileId).orderBy('locale').orderBy('key');

		return alts.map((alt) => alt.toDomain());
	}
}
