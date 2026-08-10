import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createFolderValidator } from '#validators/file'
import { ListRootFoldersAction } from '#actions/file_folder/list_root_folders_action'
import { CreateFolderAction } from '#actions/file_folder/create_folder_action'
import FileFolderTransformer from '#transformers/file_folder_transformer'

/**
 * GET  /api/v1/admin/folders — list root folders
 * POST /api/v1/admin/folders — create a folder
 */
@inject()
export default class FoldersApiController {
  constructor(
    protected listRootFoldersAction: ListRootFoldersAction,
    protected createFolderAction: CreateFolderAction
  ) {}

  async index({ serialize }: HttpContext) {
    const roots = await this.listRootFoldersAction.execute()
    return serialize(FileFolderTransformer.transform(roots))
  }

  async store(ctx: HttpContext) {
    const { request, response, serialize } = ctx
    const payload = await createFolderValidator.validate(request.all())
    const folder = await this.createFolderAction.execute({
      name: payload.name,
      parentId: payload.parentId ?? null,
    })
    return response.created(await serialize(FileFolderTransformer.transform(folder)))
  }
}
