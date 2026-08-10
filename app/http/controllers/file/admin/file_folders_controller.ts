import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { createFolderValidator, updateFolderValidator, showFileValidator } from '#validators/file'
import FileFolderTransformer from '#transformers/file_folder_transformer'
import { ListRootFoldersAction } from '#actions/file_folder/list_root_folders_action'
import { CreateFolderAction } from '#actions/file_folder/create_folder_action'
import { RenameFolderAction } from '#actions/file_folder/rename_folder_action'
import { DeleteFolderAction } from '#actions/file_folder/delete_folder_action'
import { I18nService } from '#services/i18n_service'
import { buildFileFoldersPayload } from '#helpers/i18n_payloads/file_folders'

@inject()
export default class FileFoldersController {
  constructor(
    protected i18n: I18nService,
    protected listRootFoldersAction: ListRootFoldersAction,
    protected createFolderAction: CreateFolderAction,
    protected renameFolderAction: RenameFolderAction,
    protected deleteFolderAction: DeleteFolderAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    const roots = await this.listRootFoldersAction.execute()

    return inertia.render('file/admin/folders', {
      roots: FileFolderTransformer.transform(roots),
      translations: buildFileFoldersPayload(this.i18n),
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, session } = ctx

    const payload = await createFolderValidator.validate(request.all())

    await this.createFolderAction.execute({
      name: payload.name,
      parentId: payload.parentId ?? null,
    })

    session.flash('success', this.i18n.translate('file.folder.created'))

    return response.redirect().toRoute('admin.file_folders.render')
  }

  async update(ctx: HttpContext) {
    const { params, request, response, session } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await updateFolderValidator.validate({ ...request.all(), id })

    await this.renameFolderAction.execute({ id, name: payload.name })

    session.flash('success', this.i18n.translate('file.folder.updated'))

    return response.redirect().toRoute('admin.file_folders.render')
  }

  async destroy(ctx: HttpContext) {
    const { params, response, session } = ctx

    const { id } = await showFileValidator.validate(params)

    await this.deleteFolderAction.execute({ id })

    session.flash('success', this.i18n.translate('file.folder.deleted'))

    return response.redirect().toRoute('admin.file_folders.render')
  }
}
