import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'

interface ListFileAltsPayload {
  fileId: number
}

/**
 * List all localized alt text entries for a given file.
 */
@inject()
export class ListFileAltsAction {
  constructor(protected fileRepository: FileRepository) {}

  /**
   * Execute alt text listing.
   *
   * @param payload - The file ID to list alts for.
   * @returns An array of alt text records sorted by locale and key.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for the given fileId.
   *
   * @example
   * const alts = await listFileAltsAction.execute({ fileId: 1 })
   */
  async execute(
    payload: ListFileAltsPayload
  ): Promise<{ locale: string; key: string; value: string }[]> {
    await this.fileRepository.findByIdOrFail(payload.fileId)
    return this.fileRepository.listAlts(payload.fileId)
  }
}
