import { BaseRepository } from '#core/repositories/base_repository';
import { transactionContext } from '#core/services/transaction_context';
import FileFolder from '#file/models/file_folder';

/**
 * Handles all database operations for the {@link FileFolder} model.
 *
 * Manages folder hierarchy files inside a folder are NOT deleted when the
 * folder is removed; they are moved to root via the SET NULL FK constraint.
 */
export class FileFolderRepository extends BaseRepository {
	/**
	 * Finds a folder by its primary key.
	 *
	 * @param id - The folder's primary key.
	 * @returns The matching {@link FileFolder}, or `null` if not found.
	 *
	 * @example
	 * const folder = await fileFolderRepository.findById(1)
	 */
	async findById(id: number): Promise<FileFolder | null> {
		return FileFolder.query(this.client()).where('id', id).first();
	}

	/**
	 * Returns all root-level folders (no parent), sorted alphabetically.
	 *
	 * @returns An array of top-level {@link FileFolder} records.
	 *
	 * @example
	 * const roots = await fileFolderRepository.listRoots()
	 */
	async listRoots(): Promise<FileFolder[]> {
		return FileFolder.query(this.client())
			.apply((s) => s.roots())
			.orderBy('name', 'asc');
	}

	/**
	 * Returns the direct children of a given folder, sorted alphabetically.
	 *
	 * @param parentId - The primary key of the parent folder.
	 * @returns An array of child {@link FileFolder} records.
	 *
	 * @example
	 * const children = await fileFolderRepository.listChildren(5)
	 */
	async listChildren(parentId: number): Promise<FileFolder[]> {
		return FileFolder.query(this.client()).where('parent_id', parentId).orderBy('name', 'asc');
	}

	/**
	 * Counts all folders, without loading rows.
	 *
	 * @returns The total number of {@link FileFolder} records.
	 *
	 * @example
	 * const total = await fileFolderRepository.count()
	 */
	async count(): Promise<number> {
		const result = await FileFolder.query(this.client()).count('* as total');
		return Number(result[0].$extras.total);
	}

	/**
	 * Lists every folder with the number of files it directly contains
	 * (not recursive), sorted alphabetically, with a single aggregate query.
	 *
	 * @returns One entry per folder: primary key, name, and direct file count.
	 *
	 * @example
	 * const folders = await fileFolderRepository.listWithFileCounts()
	 * // [{ id: 1, name: 'Documents', count: 4 }, { id: 2, name: 'Images', count: 12 }]
	 */
	async listWithFileCounts(): Promise<{ id: number; name: string; count: number }[]> {
		const rows = await FileFolder.query(this.client())
			.leftJoin('files', 'files.folder_id', 'file_folders.id')
			.select('file_folders.id', 'file_folders.name')
			.count('files.id as total')
			.groupBy('file_folders.id', 'file_folders.name')
			.orderBy('file_folders.name', 'asc');

		return rows.map((row) => ({
			id: row.id,
			name: row.name,
			count: Number(row.$extras.total),
		}));
	}

	/**
	 * Creates and persists a new folder.
	 *
	 * @param data - The folder data including name and optional parent ID.
	 * @returns The newly created {@link FileFolder}.
	 *
	 * @example
	 * const folder = await fileFolderRepository.create({ name: 'Documents' })
	 */
	async create(data: { name: string; parentId?: number | null }): Promise<FileFolder> {
		return FileFolder.create(
			{
				name: data.name,
				parentId: data.parentId ?? null,
			},
			this.client(),
		);
	}

	/**
	 * Updates an existing folder.
	 *
	 * @param folder - The {@link FileFolder} instance to update.
	 * @param data - Partial fields to merge into the folder.
	 * @returns The updated {@link FileFolder}.
	 *
	 * @example
	 * const updated = await fileFolderRepository.update(folder, { name: 'New Name' })
	 */
	async update(folder: FileFolder, data: Partial<{ name: string; parentId: number | null }>): Promise<FileFolder> {
		folder.merge(data as any);
		await transactionContext.merge(folder);
		await folder.save();
		return folder;
	}

	/**
	 * Deletes a folder. Files inside are NOT deleted � they are moved to root
	 * (folder_id set to null) via the SET NULL FK constraint.
	 * Child folders are also set to root via the same constraint.
	 *
	 * @param id - The primary key of the folder to delete.
	 *
	 * @example
	 * await fileFolderRepository.delete(3)
	 */
	async delete(id: number): Promise<boolean> {
		const folder = await FileFolder.query(this.client()).where('id', id).firstOrFail();
		await folder.delete();
		return true;
	}
}
