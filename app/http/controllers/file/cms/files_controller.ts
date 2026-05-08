import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { FileService } from '#services/file/file_service'
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
import { FileFolderService } from '#services/file/file_folder_service'
import FileFolderTransformer from '#transformers/file_folder_transformer'

@inject()
export default class FilesController {
  constructor(
    protected fileService: FileService,
    protected fileFolderService: FileFolderService
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request, i18n } = ctx

    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())
    const payload = await listFileValidator.validate(data)

    const files = await this.fileService.list(
      {
        folderId: payload.folder_id,
        mimeType: payload.mime_type,
        search: payload.search,
      },
      pagination
    )

    const folders = await this.fileFolderService.listRoots()

    return inertia.render('file/cms/index', {
      files: FileTransformer.paginate(files.all(), files.getMeta()),
      folders: FileFolderTransformer.transform(folders),
      filters: payload,
      translations: {
        title: i18n.t('cms.files.list.title'),
        action: {
          folders: i18n.t('cms.files.list.action.folders'),
          upload: i18n.t('cms.files.list.action.upload'),
        },
        name: i18n.t('cms.files.form.name.value'),
        type: i18n.t('cms.files.form.type.value'),
        size: i18n.t('cms.files.form.size.value'),
        uploaded_at: i18n.t('cms.files.form.uploaded_at.value'),
        upload: {
          value: i18n.t('cms.files.upload.submit'),
          help: i18n.t('cms.files.upload.help'),
          remove: i18n.t('cms.files.upload.remove'),
          max_size: i18n.t('cms.files.upload.max_size', { size: '{size}' }),
          try_again: i18n.t('cms.files.upload.try_again'),
          error: {
            size: i18n.t('cms.files.upload.error.size', { max: '{max}' }),
          },
        },
        actions: {
          value: i18n.t('cms.files.actions'),
          show: i18n.t('cms.files.show.title'),
          delete: {
            value: i18n.t('cms.files.delete.title', { filename: '{filename}' }),
            confirm: i18n.t('cms.files.delete.confirm'),
          },
        },
        folders: {
          all: i18n.t('cms.files.list.folders.all'),
        },
        search: {
          filter: i18n.t('cms.files.search.filter'),
          value: i18n.t('cms.files.search.value'),
          placeholder: i18n.t('cms.files.search.placeholder'),
          type: {
            value: i18n.t('cms.files.search.type.value'),
            options: {
              placeholder: i18n.t('cms.files.search.type.options.placeholder'),
              image: i18n.t('cms.files.search.type.options.image'),
              video: i18n.t('cms.files.search.type.options.video'),
              audio: i18n.t('cms.files.search.type.options.audio'),
              pdf: i18n.t('cms.files.search.type.options.pdf'),
            },
          },
        },
        alts: {
          title: i18n.t('cms.files.show.alts.title'),
          add: i18n.t('cms.files.show.alts.add'),
          edit: i18n.t('cms.files.show.alts.edit'),
          empty: i18n.t('cms.files.show.alts.empty'),
          close: i18n.t('cms.files.show.alts.close'),
          delete: {
            value: i18n.t('cms.files.show.alts.delete.value'),
            confirm: i18n.t('cms.files.show.alts.delete.confirm'),
          },
          form: {
            update: i18n.t('cms.files.show.alts.form.update'),
            submit: i18n.t('cms.files.show.alts.form.submit'),
            cancel: i18n.t('cms.files.show.alts.form.cancel'),
            locale: {
              value: i18n.t('cms.files.show.alts.form.locale.value'),
            },
            key: {
              value: i18n.t('cms.files.show.alts.form.key.value'),
              placeholder: i18n.t('cms.files.show.alts.form.key.placeholder'),
            },
            alt_text: {
              value: i18n.t('cms.files.show.alts.form.alt_text.value'),
              placeholder: i18n.t('cms.files.show.alts.form.alt_text.placeholder'),
            },
          },
        },
      },
    })
  }

  async upload(ctx: HttpContext) {
    const { request, response, auth, session, i18n } = ctx

    const file = request.file('file')
    const folderId = request.input('folder_id', null)
    const user = auth.getUserOrFail()

    if (!file) {
      session.flash('error', i18n.t('file.no_file_provided'))
      return response.redirect().back()
    }

    await this.fileService.upload(file, folderId ? Number(folderId) : null, user.id)

    session.flash('success', i18n.t('file.uploaded'))

    return response.redirect().back()
  }

  async move(ctx: HttpContext) {
    const { params, request, response, session, i18n } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await moveFileValidator.validate(request.all())

    await this.fileService.move(id, payload.folder_id ?? null)

    session.flash('success', i18n.t('file.moved'))

    return response.redirect().back()
  }

  async destroy(ctx: HttpContext) {
    const { params, response, session, i18n } = ctx

    const { id } = await showFileValidator.validate(params)

    await this.fileService.delete(id)

    session.flash('success', i18n.t('file.deleted'))

    return response.redirect().toRoute('admin.files.render')
  }

  async upsertAlt(ctx: HttpContext) {
    const { params, request, response, i18n } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await upsertAltValidator.validate(request.all())

    await this.fileService.upsertAlt(id, payload.locale, payload.key, payload.value)

    return response.ok({ message: i18n.t('file.alt.updated') })
  }

  async deleteAlt(ctx: HttpContext) {
    const { params, request, response, i18n } = ctx

    const { id } = await showFileValidator.validate(params)
    const payload = await deleteAltValidator.validate(request.all())

    await this.fileService.deleteAlt(id, payload.locale, payload.key)

    return response.ok({ message: i18n.t('file.alt.deleted') })
  }
}
