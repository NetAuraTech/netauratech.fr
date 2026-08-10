import { transactionContext } from '#shared/context/transaction_context'
import File from '#models/file/file'
import type { ModelPaginatorContract } from '@adonisjs/lucid/types/model'
import type { PaginationFilters } from '#types/pagination'
import { BaseRepository } from '#repositories/base_repository'

interface ListFilters {
  folderId?: number | null
  mimeType?: string
  search?: string
  disk?: string
}

/**
 * Handles all database operations for the {@link File} model.
 *
 * Manages file metadata, folder associations, and localized alt text entries.
 */
export class FileRepository extends BaseRepository {
  /**
   * Finds a file by its primary key, preloading alt text entries.
   *
   * @param id - The file's primary key.
   * @returns The matching {@link File}, or `null` if not found.
   *
   * @example
   * const file = await fileRepository.findById(1)
   */
  async findById(id: number): Promise<File | null> {
    return File.query(this.client()).where('id', id).preload('alts').first()
  }

  /**
   * Finds a file by its primary key, preloading alt text entries.
   * Throws if not found.
   *
   * @param id - The file's primary key.
   * @returns The matching {@link File}.
   * @throws {Exception} With code `E_ROW_NOT_FOUND` if no record exists for `id`.
   *
   * @example
   * const file = await fileRepository.findByIdOrFail(1)
   */
  async findByIdOrFail(id: number): Promise<File> {
    return File.query(this.client()).where('id', id).preload('alts').firstOrFail()
  }

  /**
   * Returns a paginated list of files with optional filters.
   *
   * @param filters - Optional filters for folder, MIME type, search term, and disk.
   * @param pagination - Page number and items per page.
   * @returns A paginated result set.
   *
   * @example
   * const result = await fileRepository.list({ folderId: 1 }, { page: 1, perPage: 20 })
   */
  async list(
    filters: ListFilters,
    pagination: PaginationFilters
  ): Promise<ModelPaginatorContract<File>> {
    const query = File.query(this.client())
      .preload('folder')
      .preload('alts')
      .orderBy('created_at', 'desc')

    if (filters.folderId !== undefined) {
      if (filters.folderId === null) {
        query.whereNull('folder_id')
      } else {
        query.where('folder_id', filters.folderId)
      }
    }

    if (filters.mimeType) {
      query.whereLike('mime_type', `${filters.mimeType}%`)
    }

    if (filters.search) {
      query.whereILike('original_name', `%${filters.search}%`)
    }

    if (filters.disk) {
      query.where('disk', filters.disk)
    }

    return query.paginate(pagination.page ?? 1, pagination.perPage ?? 20)
  }

  /**
   * Counts every file with a single aggregate query, without loading rows.
   *
   * @returns The total number of files.
   *
   * @example
   * const total = await fileRepository.count()
   */
  async count(): Promise<number> {
    const result = await File.query(this.client()).count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Lists the most recently uploaded files, newest first.
   *
   * @param limit - Maximum number of files to return.
   * @returns The latest {@link File} records, bounded to `limit`.
   *
   * @example
   * const latest = await fileRepository.listRecent(5)
   */
  async listRecent(limit: number): Promise<File[]> {
    return File.query(this.client()).orderBy('created_at', 'desc').limit(limit)
  }

  /**
   * Creates and persists a new file record.
   *
   * @param data - The file metadata to persist.
   * @returns The newly created {@link File}.
   *
   * @example
   * const file = await fileRepository.create({ filename, originalName, mimeType, ... })
   */
  async create(data: {
    filename: string
    originalName: string
    mimeType: string
    extension: string
    size: number
    path: string
    disk: string
    folderId?: number | null
    uploadedBy?: number | null
  }): Promise<File> {
    return File.create(data as any, this.client())
  }

  /**
   * Updates an existing file.
   *
   * @param file - The {@link File} instance to update.
   * @param data - Partial fields to merge into the file.
   * @returns The updated {@link File}.
   *
   * @example
   * const updated = await fileRepository.update(file, { originalName: 'new name.pdf' })
   */
  async update(
    file: File,
    data: Partial<{
      originalName: string
      folderId: number | null
    }>
  ): Promise<File> {
    file.merge(data as any)
    await transactionContext.merge(file)
    await file.save()
    return file
  }

  /**
   * Deletes a file by its primary key.
   *
   * @param id - The primary key of the file to delete.
   *
   * @example
   * await fileRepository.delete(1)
   */
  async delete(id: number): Promise<boolean> {
    const file = await File.query(this.client()).where('id', id).firstOrFail()
    await file.delete()
    return true
  }

  /**
   * Creates or updates a localized alt text entry for a file.
   *
   * @param fileId - The primary key of the file.
   * @param locale - The locale code (e.g., 'en', 'fr').
   * @param key - The alt text key (e.g., 'alt', 'title').
   * @param value - The localized string value.
   *
   * @example
   * await fileRepository.upsertAlt(1, 'en', 'alt', 'A beautiful sunset')
   */
  async upsertAlt(fileId: number, locale: string, key: string, value: string): Promise<void> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    await FileAlt.updateOrCreate({ fileId, locale, key }, { value }, this.client())
  }

  /**
   * Deletes a localized alt text entry for a file.
   *
   * @param fileId - The primary key of the file.
   * @param locale - The locale code to delete.
   * @param key - The alt text key to delete.
   *
   * @example
   * await fileRepository.deleteAlt(1, 'fr', 'alt')
   */
  async deleteAlt(fileId: number, locale: string, key: string): Promise<void> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    await FileAlt.query(this.client())
      .where('file_id', fileId)
      .where('locale', locale)
      .where('key', key)
      .delete()
  }

  /**
   * Returns all localized alt text entries for a file.
   *
   * @param fileId - The primary key of the file.
   * @returns An array of alt text records sorted by locale and key.
   *
   * @example
   * const alts = await fileRepository.listAlts(1)
   */
  async listAlts(fileId: number): Promise<{ locale: string; key: string; value: string }[]> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    return FileAlt.query(this.client()).where('file_id', fileId).orderBy('locale').orderBy('key')
  }
}
