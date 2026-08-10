import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { showFileValidator } from '#validators/file'
import { GetFolderDetailAction } from '#actions/file_folder/get_folder_detail_action'
import { ListFolderChildrenAction } from '#actions/file_folder/list_folder_children_action'
import FileFolderTransformer from '#transformers/file_folder_transformer'

/**
 * GET /api/v1/admin/folders/:id — show a folder
 * GET /api/v1/admin/folders/:id/children — list a folder's direct children
 */
@inject()
export default class FoldersShowApiController {
  constructor(
    protected getFolderDetailAction: GetFolderDetailAction,
    protected listFolderChildrenAction: ListFolderChildrenAction
  ) {}

  async show(ctx: HttpContext) {
    const { params, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    const folder = await this.getFolderDetailAction.execute({ id })
    return serialize(FileFolderTransformer.transform(folder))
  }

  async children(ctx: HttpContext) {
    const { params, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    await this.getFolderDetailAction.execute({ id })
    const childFolders = await this.listFolderChildrenAction.execute({ parentId: id })
    return serialize(FileFolderTransformer.transform(childFolders))
  }
}
