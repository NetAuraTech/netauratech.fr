import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'
import { LogService } from '#services/logging/log_service'
import { withTransaction } from '#shared/utils/with_transaction'

interface DeleteFilePayload {
  id: number
}

/**
 * Delete a file record and its storage asset.
 */
@inject()
export class DeleteFileAction {
  constructor(
    protected fileRepository: FileRepository,
    protected logService: LogService
  ) {}

  /**
   * Execute file deletion.
   *
   * @param payload - File ID to delete.
   * @returns `true` when the file is deleted successfully.
   */
  async execute(payload: DeleteFilePayload): Promise<boolean> {
    const file = await this.fileRepository.findByIdOrFail(payload.id)
    const deleted = await withTransaction(async () => this.fileRepository.delete(payload.id))

    // Log only after the deletion actually succeeded.
    this.logService.logBusiness(
      'file.deleted',
      {},
      { fileId: file.id, filename: file.originalName, path: file.path }
    )
    return deleted
  }
}
