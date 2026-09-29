import { BaseQuery } from '#core/queries/base_query';
import CmsFile from '#file/models/file';
import type { File as FileDomain } from '#file/domain/file';

/**
 * Read-side query for a single file by primary key, preloading its alt
 * entries. Returns `null` when no file matches the id.
 */
export class GetFileDetailQuery extends BaseQuery {
	/**
	 * Execute the file detail query.
	 *
	 * @param id - The file primary key to retrieve.
	 * @returns The {@link FileDomain} with alts preloaded, or `null`.
	 */
	async execute(id: number): Promise<FileDomain | null> {
		const file = await CmsFile.query(this.client()).where('id', id).preload('alts').first();

		return file ? file.toDomain() : null;
	}
}
