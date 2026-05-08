import { inject } from '@adonisjs/core'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'
import FileFolder from '#models/file/file_folder'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

@inject()
export class FileFolderService {
  constructor(protected folderRepository: FileFolderRepository) {}

  /**
   * Returns all root folders (those without a parent), ordered alphabetically.
   */
  async listRoots(): Promise<FileFolder[]> {
    return this.folderRepository.listRoots()
  }

  /**
   * Returns the direct children of a given folder, ordered alphabetically.
   *
   * @param parentId - The parent folder ID
   */
  async listChildren(parentId: number): Promise<FileFolder[]> {
    return this.folderRepository.listChildren(parentId)
  }

  /**
   * Creates a new folder, optionally nested inside a parent.
   *
   * @param name - Display name of the new folder
   * @param parentId - Optional parent folder ID; omit or pass `null` to create at root
   * @returns The newly created folder record
   */
  async create(name: string, parentId?: number | null): Promise<FileFolder> {
    return this.folderRepository.create({ name, parentId })
  }

  /**
   * Renames an existing folder.
   *
   * @param id - Folder ID
   * @param name - New display name
   * @returns The updated folder record
   * @throws {RowNotFoundException} When the folder does not exist
   */
  async rename(id: number, name: string): Promise<FileFolder> {
    const folder = await this.folderRepository.findById(id)

    if (!folder) {
      throw new RowNotFoundException(FileFolder)
    }

    return this.folderRepository.update(folder, { name })
  }

  /**
   * Deletes a folder.
   *
   * Files and child folders inside are **not** deleted — they are moved to
   * root (their `folder_id` is set to `null`) via the `SET NULL` foreign key
   * constraint defined on the migration.
   *
   * @param id - Folder ID
   */
  async delete(id: number): Promise<void> {
    return this.folderRepository.delete(id)
  }
}
