import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { showFileValidator } from '#validators/file'
import { DeleteFileAction } from '#actions/file/delete_file_action'

/**
 * DELETE /api/v1/admin/files/:id — delete a file.
 */
@inject()
export default class FilesDeleteApiController {
  constructor(protected deleteFileAction: DeleteFileAction) {}

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx
    const { id } = await showFileValidator.validate(params)
    await this.deleteFileAction.execute({ id })
    return response.noContent()
  }
}
