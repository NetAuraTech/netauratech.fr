import { BaseTransformer } from '@adonisjs/core/transformers'
import type File from '#models/file/file'
import { StorageService } from '#services/file/storage_service'

export default class FileTransformer extends BaseTransformer<File> {
  protected storageService: StorageService
  constructor(file: File) {
    super(file)
    this.storageService = new StorageService()
  }
  async toObject() {
    return {
      ...this.pick(this.resource, [
        'id',
        'filename',
        'originalName',
        'mimeType',
        'folderId',
        'alts',
        'extension',
        'createdAt',
      ]),
      size: this.resource.size as number,
      url: await this.storageService.url(this.resource.path, this.resource.disk),
    }
  }
}
