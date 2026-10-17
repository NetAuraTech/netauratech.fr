import { inject } from '@adonisjs/core';
import { DeleteFileAction } from '#file/actions/file/delete_file_action';
import { DeleteFileAltAction } from '#file/actions/file/delete_file_alt_action';
import { GetFileDetailAction } from '#file/actions/file/get_file_detail_action';
import { ListFilesAction } from '#file/actions/file/list_files_action';
import { MoveFileAction } from '#file/actions/file/move_file_action';
import { UpsertFileAltAction } from '#file/actions/file/upsert_file_alt_action';
import { type ApiOperationDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import {
	dateTime,
	errorSchema,
	validationErrorSchema,
	dataEnvelope,
	paginatedEnvelope,
} from '#transport/core/openapi/schemas';
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

/** The alt-text entry of a file. */
const altEntrySchema: JsonSchema = {
	type: 'object',
	properties: {
		locale: { type: 'string' },
		key: { type: 'string' },
		value: { type: 'string' },
	},
};

/**
 * The file payload, as shaped by `FileTransformer` in its lean admin/API form
 * (no display intent). The render-only fields (`width`, `height`, `variants`)
 * are only produced by the CMS render path and are not part of this contract.
 */
export const fileSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		filename: { type: 'string' },
		originalName: { type: 'string' },
		mimeType: { type: 'string' },
		folderId: { type: 'number', nullable: true },
		alts: { type: 'array', items: altEntrySchema },
		extension: { type: 'string' },
		createdAt: dateTime,
		size: { type: 'number' },
		url: { type: 'string' },
		type: { type: 'string' },
		alt: { type: 'string', nullable: true },
	},
};

/**
 * OpenAPI operation metadata for the files endpoints, declared alongside the
 * endpoint behaviour so the runtime contract and its documentation live in a
 * single place. The route module registers these under their full route names.
 */
export const filesEndpointsDocs: Record<keyof FilesEndpoints, ApiOperationDoc> = {
	index: {
		summary: 'List files',
		description: 'Paginated file listing, filterable by folder, MIME type and search term.',
		tags: ['Files'],
		request: [{ validator: listFileValidator, in: 'query' }],
		paginated: true,
		responses: {
			'200': { description: 'The paginated file list.', schema: paginatedEnvelope(fileSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
	show: {
		summary: 'Show a file',
		tags: ['Files'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'200': { description: 'The file.', schema: dataEnvelope(fileSchema) },
			'404': { description: 'The file does not exist.', schema: errorSchema },
		},
	},
	move: {
		summary: 'Move a file to another folder',
		tags: ['Files'],
		request: [
			{ validator: showFileValidator, in: 'path' },
			{ validator: moveFileValidator, in: 'body' },
		],
		responses: {
			'200': { description: 'The moved file.', schema: dataEnvelope(fileSchema) },
			'404': { description: 'The file does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
	destroy: {
		summary: 'Delete a file',
		tags: ['Files'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'204': { description: 'The file was deleted.' },
			'404': { description: 'The file does not exist.', schema: errorSchema },
		},
	},
	upsertAlt: {
		summary: 'Upsert a file alt-text entry',
		tags: ['Files'],
		request: [
			{ validator: showFileValidator, in: 'path' },
			{ validator: upsertAltValidator, in: 'body' },
		],
		responses: {
			'200': { description: 'The updated file.', schema: dataEnvelope(fileSchema) },
			'404': { description: 'The file does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
	deleteAlt: {
		summary: 'Delete a file alt-text entry',
		tags: ['Files'],
		request: [
			{ validator: showFileValidator, in: 'path' },
			{ validator: deleteAltValidator, in: 'body' },
		],
		responses: {
			'200': { description: 'The updated file.', schema: dataEnvelope(fileSchema) },
			'404': { description: 'The file does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
};

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
			docs: filesEndpointsDocs.index,
		},
		show: {
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.getFileDetailAction.execute({ id: payload.id }),
			transform: (entity) => FileTransformer.transform(entity),
			docs: filesEndpointsDocs.show,
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
			docs: filesEndpointsDocs.move,
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.deleteFileAction.execute({ id: payload.id }),
			docs: filesEndpointsDocs.destroy,
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
			docs: filesEndpointsDocs.upsertAlt,
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
			docs: filesEndpointsDocs.deleteAlt,
		},
	};
}
