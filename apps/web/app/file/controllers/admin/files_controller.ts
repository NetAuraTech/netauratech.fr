import { inject } from '@adonisjs/core';
import { DeleteFileAction } from '#file/actions/file/delete_file_action';
import { DeleteFileAltAction } from '#file/actions/file/delete_file_alt_action';
import { GetFileDetailAction } from '#file/actions/file/get_file_detail_action';
import { ListFilesAction } from '#file/actions/file/list_files_action';
import { MoveFileAction } from '#file/actions/file/move_file_action';
import { UploadFileAction } from '#file/actions/file/upload_file_action';
import { UpsertFileAltAction } from '#file/actions/file/upsert_file_alt_action';
import { ListRootFoldersAction } from '#file/actions/file_folder/list_root_folders_action';
import { extractPagination } from '#transport/core/helpers/extract_pagination';
import { I18nService } from '#transport/core/helpers/i18n_service';
import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { stripEmptyStrings } from '#transport/core/helpers/strip_empty_strings';
import { buildFilesIndexPayload } from '#transport/file/helpers/i18n_payloads/files_index';
import { buildFilesShowPayload } from '#transport/file/helpers/i18n_payloads/files_show';
import FileFolderTransformer from '#transport/file/transformers/file_folder_transformer';
import FileTransformer from '#transport/file/transformers/file_transformer';
import {
	listFileValidator,
	showFileValidator,
	moveFileValidator,
	upsertAltValidator,
	deleteAltValidator,
} from '#transport/file/validators/file';
import type { HttpContext } from '@adonisjs/core/http';

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
		protected listRootFoldersAction: ListRootFoldersAction,
	) {}

	async render(ctx: HttpContext) {
		const { inertia, request } = ctx;

		const pagination = await extractPagination(request);
		const data = stripEmptyStrings(request.all());
		const payload = await listFileValidator.validate(data);

		const files = await this.listFilesAction.execute({
			folderId: payload.folder_id,
			mimeType: payload.mime_type,
			search: payload.search,
			pagination,
		});

		const folders = await this.listRootFoldersAction.execute();

		return renderInertiaPage(inertia, 'file/admin/index', {
			files: FileTransformer.paginate(files.all(), files.getMeta()),
			folders: FileFolderTransformer.transform(folders),
			filters: payload,
			translations: buildFilesIndexPayload(this.i18n),
		});
	}

	async show(ctx: HttpContext) {
		const { inertia, params } = ctx;

		const { id } = await showFileValidator.validate(params);
		const file = await this.getFileDetailAction.execute({ id });

		return renderInertiaPage(inertia, 'file/admin/show', {
			file: FileTransformer.transform(file),
			translations: buildFilesShowPayload(this.i18n),
		});
	}

	async upload(ctx: HttpContext) {
		const { request, response, auth, session } = ctx;

		const file = request.file('file');
		const folderId = request.input('folder_id', null);
		const user = auth.getUserOrFail();

		if (!file) {
			session.flash('error', this.i18n.translate('file.no_file_provided'));
			return response.redirect().back();
		}

		await this.uploadFileAction.execute({
			file,
			folderId: folderId ? Number(folderId) : null,
			uploadedBy: user.id,
		});

		session.flash('success', this.i18n.translate('file.uploaded'));

		return response.redirect().back();
	}

	async move(ctx: HttpContext) {
		const { params, request, response, session } = ctx;

		const { id } = await showFileValidator.validate(params);
		const payload = await moveFileValidator.validate(request.all());

		await this.moveFileAction.execute({ id, folderId: payload.folder_id ?? null });

		session.flash('success', this.i18n.translate('file.moved'));

		return response.redirect().back();
	}

	async destroy(ctx: HttpContext) {
		const { params, response, session } = ctx;

		const { id } = await showFileValidator.validate(params);

		await this.deleteFileAction.execute({ id });

		session.flash('success', this.i18n.translate('file.deleted'));

		return response.redirect().toRoute('admin.file.files.render');
	}

	async upsertAlt(ctx: HttpContext) {
		const { params, request, response } = ctx;

		const { id } = await showFileValidator.validate(params);
		const payload = await upsertAltValidator.validate(request.all());

		await this.upsertFileAltAction.execute({
			fileId: id,
			locale: payload.locale,
			key: payload.key,
			value: payload.value,
		});

		return response.ok({ message: this.i18n.translate('file.alt.updated') });
	}

	async deleteAlt(ctx: HttpContext) {
		const { params, request, response } = ctx;

		const { id } = await showFileValidator.validate(params);
		const payload = await deleteAltValidator.validate(request.all());

		await this.deleteFileAltAction.execute({ fileId: id, locale: payload.locale, key: payload.key });

		return response.ok({ message: this.i18n.translate('file.alt.deleted') });
	}
}
