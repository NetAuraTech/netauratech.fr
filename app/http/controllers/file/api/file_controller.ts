import { type HttpContext } from '@adonisjs/core/http'
import { FileService } from '#services/file/file_service'
import { inject } from '@adonisjs/core'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import FileTransformer from '#transformers/file_transformer'
import { FileFolderService } from '#services/file/file_folder_service'
import FileFolderTransformer from '#transformers/file_folder_transformer'

@inject()
export default class FilesController {
  constructor(
    protected fileService: FileService,
    protected fileFolderService: FileFolderService
  ) {}

  /**
   * Returns a paginated JSON list of files for the media picker modal.
   * Called by `MediaPickerModal` via fetch — not an Inertia render.
   *
   * GET /api/admin/files?page=1&per_page=30&search=…&mime_type=…&folder_id=…
   */
  async list(ctx: HttpContext) {
    const { request, response, auth, serialize } = ctx

    auth.getUserOrFail()

    const pagination = await extractPagination(request)

    const search = request.input('search')
    const mimeType = request.input('mime_type')
    const folderId = request.input('folder_id') ? Number(request.input('folder_id')) : undefined

    const result = await this.fileService.list(
      {
        search,
        mimeType,
        folderId,
      },
      pagination
    )

    const folders = await this.fileFolderService.listRoots()

    const files = await serialize(FileTransformer.paginate(result.all(), result.getMeta()))
    const serializedFolders = await serialize(FileFolderTransformer.transform(folders))

    return response.ok({
      files,
      folders: serializedFolders?.data,
    })
  }

  async find(ctx: HttpContext) {
    const { response, params, auth, serialize } = ctx

    auth.getUserOrFail()

    const id: number = params.id

    const result = await this.fileService.detail(id)

    const file = await serialize(FileTransformer.transform(result))

    return response.ok({
      file: file.data,
    })
  }
}
