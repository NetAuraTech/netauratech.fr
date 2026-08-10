import { inject } from '@adonisjs/core'
import type CmsFile from '#models/file/file'
import { FileRepository } from '#repositories/file/file_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface MoveFilePayload {
  id: number
  folderId: number | null
}

/**
 * Move a file to a different folder.
 */
@inject()
export class MoveFileAction {
  constructor(protected fileRepository: FileRepository) {}

  /**
   * Execute file move.
   *
   * @param payload - File ID and target folder ID (null for root).
   * @returns The updated {@link CmsFile}.
   */
  async execute(payload: MoveFilePayload): Promise<CmsFile> {
    const file = await this.fileRepository.findByIdOrFail(payload.id)

    return withTransaction(async () => {
      return this.fileRepository.update(file, { folderId: payload.folderId })
    })
  }
}
