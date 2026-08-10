import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { showFileValidator } from '#validators/file'
import FileTransformer from '#transformers/file_transformer'
import { GetFileDetailAction } from '#actions/file/get_file_detail_action'

/**
 * GET /api/v1/admin/files/:id — show a single file with its alts.
 */
@inject()
export default class FilesShowApiController {
  constructor(protected getFileDetailAction: GetFileDetailAction) {}

  /**
   * Show a single file with its alt texts.
   */
  async show(ctx: HttpContext) {
    const { params, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    const file = await this.getFileDetailAction.execute({ id })
    return serialize(FileTransformer.transform(file))
  }
}
