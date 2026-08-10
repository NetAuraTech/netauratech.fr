import { BaseTransformer } from '@adonisjs/core/transformers'
import type File from '#models/file/file'
import { StorageService } from '#services/file/storage_service'
import { resolveFileForRender } from '#services/file/file_resolver'
import { classifyFileType } from '#services/file/file_type'

/**
 * Options passed to the transformer when producing a render-ready prop.
 * When a display intent is present the output carries the resolved alt and
 * responsive variants; without one the transformer keeps the lean admin/API
 * shape.
 */
export interface FileTransformOptions {
  locale?: string
  altKey?: string | null
  altOverride?: string | null
}

export default class FileTransformer extends BaseTransformer<File> {
  protected storageService: StorageService
  constructor(
    file: File,
    protected options: FileTransformOptions = {}
  ) {
    super(file)
    this.storageService = new StorageService()
  }
  async toObject() {
    const hasIntent = Boolean(
      this.options.locale || this.options.altKey || this.options.altOverride
    )

    const base = {
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

    const resolved = hasIntent ? await resolveFileForRender(this.resource, this.options) : null

    return {
      ...base,
      type: resolved?.type ?? classifyFileType(this.resource.mimeType),
      alt: resolved?.alt ?? this.resource.resolveAlt(this.options.locale ?? 'en', null, null),
      width: resolved?.width,
      height: resolved?.height,
      variants: resolved?.variants,
    }
  }
}
