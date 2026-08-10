import { type HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import FileTransformer from '#transformers/file_transformer'
import FileFolderTransformer from '#transformers/file_folder_transformer'
import { ListFilesAction } from '#actions/file/list_files_action'
import { GetFileDetailAction } from '#actions/file/get_file_detail_action'
import { UploadFileAction } from '#actions/file/upload_file_action'
import { ListRootFoldersAction } from '#actions/file_folder/list_root_folders_action'

@inject()
export default class FilesController {
  constructor(
    protected listFilesAction: ListFilesAction,
    protected getFileDetailAction: GetFileDetailAction,
    protected uploadFileAction: UploadFileAction,
    protected listRootFoldersAction: ListRootFoldersAction
  ) {}

  /**
   * POST /api/admin/files/upload
   *
   * JSON-friendly upload used by the template thumbnail capture. Accepts a
   * multipart `file` (plus optional `folder_id`) and returns the serialized
   * `File` record so the caller can store its id (e.g. as `thumbnailId`).
   */
  async upload(ctx: HttpContext) {
    const { request, response, auth, serialize } = ctx

    const user = auth.getUserOrFail()
    const file = request.file('file')

    if (!file) {
      return response.badRequest({
        error: { code: 'E_NO_FILE', message: 'file field is required' },
      })
    }

    const folderId = request.input('folder_id') ? Number(request.input('folder_id')) : null

    const result = await this.uploadFileAction.execute({
      file,
      folderId,
      uploadedBy: user.id,
    })

    const serialized = await serialize(FileTransformer.transform(result))

    return response.created({ file: serialized.data })
  }

  async list(ctx: HttpContext) {
    const { request, response, auth, serialize } = ctx

    auth.getUserOrFail()

    const pagination = await extractPagination(request)

    const search = request.input('search')
    const mimeType = request.input('mime_type')
    const folderId = request.input('folder_id') ? Number(request.input('folder_id')) : undefined

    const result = await this.listFilesAction.execute({
      search,
      mimeType,
      folderId,
      pagination,
    })

    const folders = await this.listRootFoldersAction.execute()

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

    const result = await this.getFileDetailAction.execute({ id })

    const file = await serialize(FileTransformer.transform(result))

    return response.ok({
      file: file.data,
    })
  }
}
