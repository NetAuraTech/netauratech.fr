import { inject } from '@adonisjs/core'
import { FileRepository } from '#repositories/file/file_repository'
import type { PaginationFilters } from '#types/pagination'
import { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import File from '#models/file/file'

interface ListFilesPayload {
  folderId?: number | null
  mimeType?: string
  search?: string
  pagination: PaginationFilters
}

/**
 * List files with optional filters and pagination.
 */
@inject()
export class ListFilesAction {
  constructor(protected fileRepository: FileRepository) {}

  /**
   * Execute file listing.
   *
   * @param payload - Filters (folder, MIME type, search) and pagination parameters.
   * @returns A paginated result set of files.
   *
   * @example
   * const result = await listFilesAction.execute({ folderId: 1, pagination: { page: 1, perPage: 20 } })
   */
  async execute(payload: ListFilesPayload): Promise<ModelPaginatorContract<File>> {
    return this.fileRepository.list(
      { folderId: payload.folderId, mimeType: payload.mimeType, search: payload.search },
      payload.pagination
    )
  }
}
