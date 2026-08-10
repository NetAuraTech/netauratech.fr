import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListFilesAction } from '#actions/file/list_files_action'
import { MoveFileAction } from '#actions/file/move_file_action'
import { listFileValidator, showFileValidator, moveFileValidator } from '#validators/file'
import FileTransformer from '#transformers/file_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'

/**
 * GET  /api/v1/admin/files — list files
 * PUT  /api/v1/admin/files/:id/move — move a file to another folder
 */
@inject()
export default class FilesApiController {
  constructor(
    protected listFilesAction: ListFilesAction,
    protected moveFileAction: MoveFileAction
  ) {}

  async index(ctx: HttpContext) {
    const { request, serialize } = ctx
    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listFileValidator.validate(data)
    const files = await this.listFilesAction.execute({
      folderId: payload.folder_id ?? null,
      mimeType: payload.mime_type,
      search: payload.search,
      pagination,
    })
    return serialize(FileTransformer.paginate(files.all(), files.getMeta()))
  }

  async move(ctx: HttpContext) {
    const { params, request, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    const { folder_id: folderId } = await moveFileValidator.validate(request.all())
    const file = await this.moveFileAction.execute({ id, folderId: folderId ?? null })
    return serialize(FileTransformer.transform(file))
  }
}
