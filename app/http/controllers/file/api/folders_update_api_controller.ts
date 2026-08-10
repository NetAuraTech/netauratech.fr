import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { updateFolderValidator } from '#validators/file'
import { RenameFolderAction } from '#actions/file_folder/rename_folder_action'
import FileFolderTransformer from '#transformers/file_folder_transformer'

/**
 * PUT /api/v1/admin/folders/:id — rename a folder
 */
@inject()
export default class FoldersUpdateApiController {
  constructor(protected renameFolderAction: RenameFolderAction) {}

  async update(ctx: HttpContext) {
    const { params, request, response, serialize } = ctx
    const payload = await updateFolderValidator.validate({
      id: Number(params.id),
      name: request.input('name'),
    })
    const folder = await this.renameFolderAction.execute({ id: payload.id, name: payload.name })
    return response.ok(await serialize(FileFolderTransformer.transform(folder)))
  }
}
