import { inject } from '@adonisjs/core'
import FileFolder from '#models/file/file_folder'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'

interface ListFolderChildrenPayload {
  parentId: number
}

/**
 * List the direct children of a given folder, sorted alphabetically.
 */
@inject()
export class ListFolderChildrenAction {
  constructor(protected folderRepository: FileFolderRepository) {}

  /**
   * Execute child folder listing.
   *
   * @param payload - The parent folder ID to list children for.
   * @returns An array of child {@link FileFolder} records.
   *
   * @example
   * const children = await listFolderChildrenAction.execute({ parentId: 5 })
   */
  async execute(payload: ListFolderChildrenPayload): Promise<FileFolder[]> {
    return this.folderRepository.listChildren(payload.parentId)
  }
}
