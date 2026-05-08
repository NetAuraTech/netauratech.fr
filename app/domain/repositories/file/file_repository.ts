import File from '#models/file/file'
import type { PaginationFilters } from '#types/pagination'

interface ListFilters {
  folderId?: number | null
  mimeType?: string
  search?: string
  disk?: string
}

export class FileRepository {
  async findById(id: number): Promise<File | null> {
    return File.query().where('id', id).preload('alts').first()
  }

  async findByIdOrFail(id: number): Promise<File> {
    return File.query().where('id', id).preload('alts').firstOrFail()
  }

  async list(filters: ListFilters, pagination: PaginationFilters) {
    const query = File.query().preload('folder').preload('alts').orderBy('created_at', 'desc')

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
    return File.create(data as any)
  }

  async update(
    file: File,
    data: Partial<{
      originalName: string
      folderId: number | null
    }>
  ): Promise<File> {
    file.merge(data)
    await file.save()
    return file
  }

  async delete(id: number): Promise<void> {
    const file = await File.findOrFail(id)
    await file.delete()
  }

  async upsertAlt(fileId: number, locale: string, key: string, value: string): Promise<void> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    await FileAlt.updateOrCreate({ fileId, locale, key }, { value })
  }

  async deleteAlt(fileId: number, locale: string, key: string): Promise<void> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    await FileAlt.query()
      .where('file_id', fileId)
      .where('locale', locale)
      .where('key', key)
      .delete()
  }

  async listAlts(fileId: number): Promise<{ locale: string; key: string; value: string }[]> {
    const { default: FileAlt } = await import('#models/file/file_alt')

    return FileAlt.query().where('file_id', fileId).orderBy('locale').orderBy('key')
  }
}
