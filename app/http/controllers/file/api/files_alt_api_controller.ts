import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { showFileValidator, upsertAltValidator, deleteAltValidator } from '#validators/file'
import { UpsertFileAltAction } from '#actions/file/upsert_file_alt_action'
import { DeleteFileAltAction } from '#actions/file/delete_file_alt_action'
import { GetFileDetailAction } from '#actions/file/get_file_detail_action'
import FileTransformer from '#transformers/file_transformer'

/**
 * PUT    /api/v1/admin/files/:id/alt — upsert an alt-text entry
 * DELETE /api/v1/admin/files/:id/alt — delete an alt-text entry
 */
@inject()
export default class FilesAltApiController {
  constructor(
    protected upsertFileAltAction: UpsertFileAltAction,
    protected deleteFileAltAction: DeleteFileAltAction,
    protected getFileDetailAction: GetFileDetailAction
  ) {}

  async upsertAlt(ctx: HttpContext) {
    const { params, request, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    const payload = await upsertAltValidator.validate(request.all())

    await this.upsertFileAltAction.execute({
      fileId: id,
      locale: payload.locale,
      key: payload.key,
      value: payload.value,
    })

    const file = await this.getFileDetailAction.execute({ id })
    return serialize(FileTransformer.transform(file))
  }

  async deleteAlt(ctx: HttpContext) {
    const { params, request, serialize } = ctx
    const { id } = await showFileValidator.validate(params)
    const payload = await deleteAltValidator.validate(request.all())

    await this.deleteFileAltAction.execute({
      fileId: id,
      locale: payload.locale,
      key: payload.key,
    })

    const file = await this.getFileDetailAction.execute({ id })
    return serialize(FileTransformer.transform(file))
  }
}
