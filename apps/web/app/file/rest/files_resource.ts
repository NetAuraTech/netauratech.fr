import { inject } from '@adonisjs/core';
import { DeleteFileAction } from '#file/actions/file/delete_file_action';
import { DeleteFileAltAction } from '#file/actions/file/delete_file_alt_action';
import { GetFileDetailAction } from '#file/actions/file/get_file_detail_action';
import { ListFilesAction } from '#file/actions/file/list_files_action';
import { MoveFileAction } from '#file/actions/file/move_file_action';
import { UpsertFileAltAction } from '#file/actions/file/upsert_file_alt_action';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import FileTransformer from '#transport/file/transformers/file_transformer';
import {
	listFileValidator,
	showFileValidator,
	moveFileValidator,
	upsertAltValidator,
	deleteAltValidator,
} from '#transport/file/validators/file';
import type { File } from '#file/domain/file';
import type FileModel from '#file/models/file';
import type { Infer } from '@vinejs/vine/types';

type FileListPagination = Awaited<ReturnType<ListFilesAction['execute']>>;
type FileMoveResult = Awaited<ReturnType<MoveFileAction['execute']>>;
type FileDeleteResult = Awaited<ReturnType<DeleteFileAction['execute']>>;

type FileListPayload = Infer<typeof listFileValidator>;
type FileIdPayload = Infer<typeof showFileValidator>;
type FileMovePayload = Infer<typeof moveFileValidator>;
type FileUpsertAltPayload = Infer<typeof upsertAltValidator>;
type FileDeleteAltPayload = Infer<typeof deleteAltValidator>;

/**
 * Endpoint declarations for the files REST resource.
 */
export interface FilesEndpoints {
	index: RestEndpoint<undefined, FileListPayload, FileListPagination, FileListPagination>;
	show: RestEndpoint<undefined, FileIdPayload, File, File>;
	move: RestEndpoint<{ id: number }, FileMovePayload, FileMoveResult, FileModel>;
	destroy: RestEndpoint<undefined, FileIdPayload, FileDeleteResult, FileDeleteResult>;
	upsertAlt: RestEndpoint<{ id: number }, FileUpsertAltPayload, void, File>;
	deleteAlt: RestEndpoint<{ id: number }, FileDeleteAltPayload, void, File>;
}

/**
 * Declarative files REST resource.
 *
 * Owns the files endpoint declarations consumed by the REST `handle`
 * adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/files` controllers
 * reduce to one-line dispatch over `endpoints`.
 */
@inject()
export default class FilesResource {
	constructor(
		protected listFilesAction: ListFilesAction,
		protected getFileDetailAction: GetFileDetailAction,
		protected moveFileAction: MoveFileAction,
		protected deleteFileAction: DeleteFileAction,
		protected upsertFileAltAction: UpsertFileAltAction,
		protected deleteFileAltAction: DeleteFileAltAction,
	) {}

	readonly endpoints: FilesEndpoints = {
		index: {
			paginated: true,
			strip: true,
			validator: () => listFileValidator,
			execute: (_context, _prepared, payload) =>
				this.listFilesAction.execute({
					folderId: payload.folder_id ?? null,
					mimeType: payload.mime_type,
					search: payload.search,
					pagination: _context.pagination!,
				}),
			transform: (entity) => FileTransformer.paginate(entity.all(), entity.getMeta()),
		},
		show: {
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.getFileDetailAction.execute({ id: payload.id }),
			transform: (entity) => FileTransformer.transform(entity),
		},
		move: {
			prepare: async (context) => {
				const { id } = await showFileValidator.validate(context.params);

				return { id };
			},
			validator: () => moveFileValidator,
			execute: (_context, prepared, payload) =>
				this.moveFileAction.execute({ id: prepared.id, folderId: payload.folder_id ?? null }),
			transform: (entity) => FileTransformer.transform(entity.toDomain()),
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.deleteFileAction.execute({ id: payload.id }),
		},
		upsertAlt: {
			prepare: async (context) => {
				const { id } = await showFileValidator.validate(context.params);

				return { id };
			},
			validator: () => upsertAltValidator,
			execute: (_context, prepared, payload) =>
				this.upsertFileAltAction.execute({
					fileId: prepared.id,
					locale: payload.locale,
					key: payload.key,
					value: payload.value,
				}),
			refetch: (_context, prepared) => this.getFileDetailAction.execute({ id: prepared.id }),
			transform: (entity) => FileTransformer.transform(entity),
		},
		deleteAlt: {
			prepare: async (context) => {
				const { id } = await showFileValidator.validate(context.params);

				return { id };
			},
			validator: () => deleteAltValidator,
			execute: (_context, prepared, payload) =>
				this.deleteFileAltAction.execute({
					fileId: prepared.id,
					locale: payload.locale,
					key: payload.key,
				}),
			refetch: (_context, prepared) => this.getFileDetailAction.execute({ id: prepared.id }),
			transform: (entity) => FileTransformer.transform(entity),
		},
	};
}
