import { inject } from '@adonisjs/core'
import FileFolder from '#models/file/file_folder'
import { FileFolderRepository } from '#repositories/file/file_folder_repository'
import { LogService } from '#services/logging/log_service'
import { withTransaction } from '#shared/utils/with_transaction'

interface CreateFolderPayload {
  name: string
  parentId?: number | null
}

/**
 * Create a new folder in the file system.
 */
@inject()
export class CreateFolderAction {
  constructor(
    protected folderRepository: FileFolderRepository,
    protected logService: LogService
  ) {}

  /**
   * Execute folder creation.
   *
   * @param payload - Folder name and optional parent ID.
   * @returns The newly created {@link FileFolder}.
   */
  async execute(payload: CreateFolderPayload): Promise<FileFolder> {
    const folder = await withTransaction(async () => {
      return this.folderRepository.create({
        name: payload.name,
        parentId: payload.parentId ?? null,
      })
    })

    this.logService.logBusiness('folder.created', {}, { folderId: folder.id, name: folder.name })

    return folder
  }
}
