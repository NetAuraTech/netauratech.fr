import { inject } from '@adonisjs/core'
import FileFolder from '#models/file/file_folder'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'

interface GetFolderDetailPayload {
  id: number
}

/**
 * Retrieve a single folder by its primary key.
 */
@inject()
export class GetFolderDetailAction {
  constructor(protected folderRepository: FileFolderRepository) {}

  /**
   * Execute folder detail lookup.
   *
   * @param payload - The folder ID to retrieve.
   * @returns The {@link FileFolder}.
   * @throws {RowNotFoundException} When the folder does not exist.
   */
  async execute(payload: GetFolderDetailPayload): Promise<FileFolder> {
    const folder = await this.folderRepository.findById(payload.id)
    if (!folder) {
      throw new RowNotFoundException(FileFolder)
    }
    return folder
  }
}
