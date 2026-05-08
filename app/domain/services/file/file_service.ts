import { inject } from '@adonisjs/core'
import { randomUUID } from 'node:crypto'
import { readFile, unlink } from 'node:fs/promises'
import path from 'node:path'
import { FileRepository } from '#repositories/file/file_repository'
import { StorageService } from '#services/file/storage_service'
import { LogService } from '#services/logging/log_service'
import type CmsFile from '#models/file/file'
import type { MultipartFile } from '@adonisjs/core/types/bodyparser'
import type { PaginationFilters } from '#types/pagination'
import env from '#start/env'
import FileTooLargeException from '#exceptions/file/file_too_large_exception'
import InvalidExtensionException from '#exceptions/file/invalid_extension_exception'

interface ListFilters {
  folderId?: number | null
  mimeType?: string
  search?: string
}

@inject()
export class FileService {
  constructor(
    protected fileRepository: FileRepository,
    protected storageService: StorageService,
    protected logService: LogService
  ) {}

  /**
   * Returns a paginated list of files, optionally filtered by folder,
   * MIME type prefix, or filename search.
   *
   * @param filters - Optional search and filter criteria
   * @param pagination - Page number and per-page count
   */
  async list(filters: ListFilters, pagination: PaginationFilters) {
    return this.fileRepository.list(filters, pagination)
  }

  /**
   * Returns a single file with its alt entries preloaded.
   *
   * @param id - File ID
   */
  async detail(id: number): Promise<CmsFile> {
    return this.fileRepository.findByIdOrFail(id)
  }

  /**
   * Validates, uploads, and persists a multipart file.
   *
   * Validation checks file size against `MAX_UPLOAD_SIZE` (in MB) and
   * the extension against `CMS_ALLOWED_EXTENSIONS`. The file is moved to a
   * temporary directory, uploaded to the configured storage disk under the
   * `cms/files/` prefix, and then the temp file is cleaned up.
   *
   * @param file - The multipart file from the request
   * @param folderId - Optional destination folder ID (null = root)
   * @param uploadedBy - ID of the authenticated user
   * @returns The newly created file record
   * @throws {FileTooLargeException} When the file exceeds the size limit
   * @throws {InvalidExtensionException} When the file has a disallowed extension
   */
  async upload(
    file: MultipartFile,
    folderId: number | null = null,
    uploadedBy: number | null = null
  ): Promise<CmsFile> {
    const maxSizeBytes = env.get('MAX_UPLOAD_SIZE', 10) * 1024 * 1024
    const allowedExtensions = env
      .get('CMS_ALLOWED_EXTENSIONS', 'jpg,jpeg,png,gif,webp,pdf,svg,mp4,mp3,zip')
      .split(',')
      .map((e: string) => e.trim().toLowerCase())

    const ext = file.extname?.toLowerCase() ?? ''

    if (file.size > maxSizeBytes) {
      throw new FileTooLargeException()
    }

    if (!allowedExtensions.includes(ext)) {
      throw new InvalidExtensionException(ext)
    }

    const disk = this.storageService.disk()
    const filename = `${randomUUID()}.${ext}`
    const tmpPath = path.join(process.cwd(), 'tmp', filename)
    const storagePath = this.storageService.buildPath(`files/${filename}`)

    await file.move(path.join(process.cwd(), 'tmp'), { name: filename })

    const contents = await readFile(tmpPath)

    await this.storageService.upload(contents, storagePath, disk, {
      contentType: file.type ? `${file.type}/${file.subtype}` : undefined,
    })

    await unlink(tmpPath).catch(() => {})

    const record = await this.fileRepository.create({
      filename,
      originalName: file.clientName,
      mimeType: file.type ? `${file.type}/${file.subtype}` : 'application/octet-stream',
      extension: ext,
      size: file.size,
      path: storagePath,
      disk,
      folderId,
      uploadedBy,
    })

    this.logService.logBusiness(
      'file.uploaded',
      {
        userId: uploadedBy ?? undefined,
      },
      { fileId: record.id, filename: record.originalName, disk }
    )

    return record
  }

  /**
   * Moves a file to a different folder without touching the physical file.
   * Pass `null` as `folderId` to move the file to the root level.
   *
   * @param id - File ID
   * @param folderId - Destination folder ID, or `null` for root
   * @returns The updated file record
   */
  async move(id: number, folderId: number | null): Promise<CmsFile> {
    const file = await this.fileRepository.findByIdOrFail(id)
    return this.fileRepository.update(file, { folderId })
  }

  /**
   * Deletes the physical file from storage and removes the DB record.
   * The `beforeDelete` hook on the `CmsFile` model handles the physical deletion
   * via `StorageService.delete`, which silently ignores missing files.
   *
   * @param id - File ID
   */
  async delete(id: number): Promise<void> {
    const file = await this.fileRepository.findByIdOrFail(id)

    this.logService.logBusiness(
      'file.deleted',
      {},
      {
        fileId: file.id,
        filename: file.originalName,
        path: file.path,
      }
    )

    return this.fileRepository.delete(id)
  }

  /**
   * Creates or updates a named alt text entry for a specific locale and key.
   * Uses `updateOrCreate` semantics — safe to call multiple times.
   *
   * @param fileId - File ID
   * @param locale - Locale code (e.g. `'en'`, `'fr'`)
   * @param key - Named alt key (e.g. `'hero'`, `'thumbnail'`)
   * @param value - Alt text value for this locale and key
   */
  async upsertAlt(fileId: number, locale: string, key: string, value: string): Promise<void> {
    await this.fileRepository.findByIdOrFail(fileId)
    return this.fileRepository.upsertAlt(fileId, locale, key, value)
  }

  /**
   * Deletes a specific named alt text entry.
   *
   * @param fileId - File ID
   * @param locale - Locale code
   * @param key - Named alt key to delete
   */
  async deleteAlt(fileId: number, locale: string, key: string): Promise<void> {
    return this.fileRepository.deleteAlt(fileId, locale, key)
  }

  /**
   * Returns all alt text entries for a file, across all locales and keys,
   * ordered by locale then key.
   *
   * @param fileId - File ID
   */
  async listAlts(fileId: number) {
    await this.fileRepository.findByIdOrFail(fileId)
    return this.fileRepository.listAlts(fileId)
  }
}
