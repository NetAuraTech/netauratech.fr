import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  listFileValidator,
  showFileValidator,
  moveFileValidator,
  upsertAltValidator,
  deleteAltValidator,
} from '#validators/file'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import FileTransformer from '#transformers/file_transformer'
import FileFolderTransformer from '#transformers/file_folder_transformer'
import { ListFilesAction } from '#actions/file/list_files_action'
import { GetFileDetailAction } from '#actions/file/get_file_detail_action'
import { UploadFileAction } from '#actions/file/upload_file_action'
import { MoveFileAction } from '#actions/file/move_file_action'
import { DeleteFileAction } from '#actions/file/delete_file_action'
import { UpsertFileAltAction } from '#actions/file/upsert_file_alt_action'
import { DeleteFileAltAction } from '#actions/file/delete_file_alt_action'
import { ListRootFoldersAction } from '#actions/file_folder/list_root_folders_action'
import { I18nService } from '#services/i18n_service'
import { buildFilesIndexPayload } from '#helpers/i18n_payloads/files_index'
import { buildFilesShowPayload } from '#helpers/i18n_payloads/files_show'

@inject()
export default class FilesController {
  constructor(
    protected i18n: I18nService,
    protected listFilesAction: ListFilesAction,
    protected getFileDetailAction: GetFileDetailAction,
    protected uploadFileAction: UploadFileAction,
    protected moveFileAction: MoveFileAction,
    protected deleteFileAction: DeleteFileAction,
    protected upsertFileAltAction: UpsertFileAltAction,
    protected deleteFileAltAction: DeleteFileAltAction,
    protected listRootFoldersAction: ListRootFoldersAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listFileValidator.validate(data)

    const files = await this.listFilesAction.execute({
      folderId: payload.folder_id,
      mimeType: payload.mime_type,
      search: payload.search,
      pagination,
    })

    const folders = await this.listRootFoldersAction.execute()

    return inertia.render('file/admin/index', {
      files: FileTransformer.paginate(files.all(), files.getMeta()),
      folders: FileFolderTransformer.transform(folders),
      filters: payload,
      translations: buildFilesIndexPayload(this.i18n),
    })
  }

  async show(ctx: HttpContext) {
    const { inertia, params } = ctx

    const { id } = await showFileValidator.validate(params)
    const file = await this.getFileDetailAction.execute({ id })

    return (inertia.render as any)('file/admin/show', {
      file: FileTransformer.transform(file),
      translations: buildFilesShowPayload(this.i18n),
    })
  }

  async upload(ctx: HttpContext) {
    const { request, response, auth, session } = ctx

    const file = request.file('file')
    const folderId = request.input('folder_id', null)
    const user = auth.getUserOrFail()

    if (!file) {
      session.flash('error', this.i18n.translate('file.no_file_provided'))
      return response.redirect().back()
    }

    await this.uploadFileAction.execute({
      file,
      folderId: folderId ? Number(folderId) : null,
      uploadedBy: user.id,
    })

    session.flash('success', this.i18n.translate('file.uploaded'))

    return response.redirect().back()
  }

  async move(ctx: HttpContext) {
    const { params, request, response, session } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await moveFileValidator.validate(request.all())

    await this.moveFileAction.execute({ id, folderId: payload.folder_id ?? null })

    session.flash('success', this.i18n.translate('file.moved'))

    return response.redirect().back()
  }

  async destroy(ctx: HttpContext) {
    const { params, response, session } = ctx

    const { id } = await showFileValidator.validate(params)

    await this.deleteFileAction.execute({ id })

    session.flash('success', this.i18n.translate('file.deleted'))

    return response.redirect().toRoute('admin.files.render')
  }

  async upsertAlt(ctx: HttpContext) {
    const { params, request, response } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await upsertAltValidator.validate(request.all())

    await this.upsertFileAltAction.execute({
      fileId: id,
      locale: payload.locale,
      key: payload.key,
      value: payload.value,
    })

    return response.ok({ message: this.i18n.translate('file.alt.updated') })
  }

  async deleteAlt(ctx: HttpContext) {
    const { params, request, response } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await deleteAltValidator.validate(request.all())

    await this.deleteFileAltAction.execute({ fileId: id, locale: payload.locale, key: payload.key })

    return response.ok({ message: this.i18n.translate('file.alt.deleted') })
  }
}
