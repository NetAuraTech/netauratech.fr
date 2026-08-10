import { inject } from '@adonisjs/core'
import FileFolder from '#models/file/file_folder'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'

/**
 * List all root-level folders (no parent), sorted alphabetically.
 */
@inject()
export class ListRootFoldersAction {
  constructor(protected folderRepository: FileFolderRepository) {}

  /**
   * Execute root folder listing.
   *
   * @returns An array of top-level {@link FileFolder} records.
   *
   * @example
   * const folders = await listRootFoldersAction.execute()
   */
  async execute(): Promise<FileFolder[]> {
    return this.folderRepository.listRoots()
  }
}
