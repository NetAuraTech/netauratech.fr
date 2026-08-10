import { inject } from '@adonisjs/core'
import type CmsFile from '#models/file/file'
import { FileRepository } from '#repositories/file/file_repository'

interface GetFileDetailPayload {
  id: number
}

/**
 * Retrieve a single file by its primary key, preloading alt text entries.
 */
@inject()
export class GetFileDetailAction {
  constructor(protected fileRepository: FileRepository) {}

  /**
   * Execute file detail lookup.
   *
   * @param payload - The file ID to retrieve.
   * @returns The {@link CmsFile} with alts preloaded.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for the given id.
   *
   * @example
   * const file = await getFileDetailAction.execute({ id: 1 })
   */
  async execute(payload: GetFileDetailPayload): Promise<CmsFile> {
    return this.fileRepository.findByIdOrFail(payload.id)
  }
}
