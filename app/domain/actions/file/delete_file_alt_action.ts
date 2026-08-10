import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface DeleteFileAltPayload {
  fileId: number
  locale: string
  key: string
}

/**
 * Delete an alternative text entry for a file.
 */
@inject()
export class DeleteFileAltAction {
  constructor(protected fileRepository: FileRepository) {}

  /**
   * Execute alt deletion.
   *
   * @param payload - File ID, locale, and key of the alt to delete.
   */
  async execute(payload: DeleteFileAltPayload): Promise<void> {
    return withTransaction(async () => {
      return this.fileRepository.deleteAlt(payload.fileId, payload.locale, payload.key)
    })
  }
}
