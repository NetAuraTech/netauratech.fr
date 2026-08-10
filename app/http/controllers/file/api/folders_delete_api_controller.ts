import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { showFileValidator } from '#validators/file'
import { DeleteFolderAction } from '#actions/file_folder/delete_folder_action'

/**
 * DELETE /api/v1/admin/folders/:id — delete a folder
 */
@inject()
export default class FoldersDeleteApiController {
  constructor(protected deleteFolderAction: DeleteFolderAction) {}

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const { id } = await showFileValidator.validate(params)
    await this.deleteFolderAction.execute({ id })
    return response.noContent()
  }
}
