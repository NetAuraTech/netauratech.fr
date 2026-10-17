import { inject } from '@adonisjs/core';
import { CreateFolderAction } from '#file/actions/file_folder/create_folder_action';
import { DeleteFolderAction } from '#file/actions/file_folder/delete_folder_action';
import { GetFolderDetailAction } from '#file/actions/file_folder/get_folder_detail_action';
import { ListFolderChildrenAction } from '#file/actions/file_folder/list_folder_children_action';
import { ListRootFoldersAction } from '#file/actions/file_folder/list_root_folders_action';
import { RenameFolderAction } from '#file/actions/file_folder/rename_folder_action';
import { type ApiOperationDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { errorSchema, validationErrorSchema, dataEnvelope } from '#transport/core/openapi/schemas';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import FileFolderTransformer from '#transport/file/transformers/file_folder_transformer';
import { showFileValidator, createFolderValidator, updateFolderValidator } from '#transport/file/validators/file';
import type { Infer } from '@vinejs/vine/types';

type FolderListResult = Awaited<ReturnType<ListRootFoldersAction['execute']>>;
type FolderDetail = Awaited<ReturnType<GetFolderDetailAction['execute']>>;
type FolderChildren = Awaited<ReturnType<ListFolderChildrenAction['execute']>>;
type FolderCreateResult = Awaited<ReturnType<CreateFolderAction['execute']>>;
type FolderRenameResult = Awaited<ReturnType<RenameFolderAction['execute']>>;
type FolderDeleteResult = Awaited<ReturnType<DeleteFolderAction['execute']>>;

type FolderIdPayload = Infer<typeof showFileValidator>;
type FolderCreatePayload = Infer<typeof createFolderValidator>;
type FolderUpdatePayload = Infer<typeof updateFolderValidator>;

/** The folder node, as shaped by `FileFolderTransformer` (children are nested trees). */
export const folderSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		parentId: { type: 'number', nullable: true },
		children: { type: 'array', items: { type: 'object' } },
	},
};

/**
 * OpenAPI operation metadata for the folders endpoints, declared alongside the
 * endpoint behaviour so the runtime contract and its documentation live in a
 * single place. The route module registers these under their full route names.
 */
export const foldersEndpointsDocs: Record<keyof FoldersEndpoints, ApiOperationDoc> = {
	index: {
		summary: 'List root folders',
		tags: ['Folders'],
		responses: {
			'200': {
				description: 'The root folder tree.',
				schema: dataEnvelope({ type: 'array', items: folderSchema }),
			},
		},
	},
	show: {
		summary: 'Show a folder',
		tags: ['Folders'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'200': { description: 'The folder tree.', schema: dataEnvelope(folderSchema) },
			'404': { description: 'The folder does not exist.', schema: errorSchema },
		},
	},
	children: {
		summary: "List a folder's direct children",
		tags: ['Folders'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'200': {
				description: 'The direct child folders.',
				schema: dataEnvelope({ type: 'array', items: folderSchema }),
			},
			'404': { description: 'The folder does not exist.', schema: errorSchema },
		},
	},
	store: {
		summary: 'Create a folder',
		tags: ['Folders'],
		request: [{ validator: createFolderValidator, in: 'body' }],
		responses: {
			'201': { description: 'The created folder.', schema: dataEnvelope(folderSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
	update: {
		summary: 'Rename a folder',
		tags: ['Folders'],
		request: [
			{ validator: showFileValidator, in: 'path' },
			{ validator: updateFolderValidator, in: 'body' },
		],
		responses: {
			'200': { description: 'The renamed folder.', schema: dataEnvelope(folderSchema) },
			'404': { description: 'The folder does not exist.', schema: errorSchema },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	},
	destroy: {
		summary: 'Delete a folder',
		tags: ['Folders'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'204': { description: 'The folder was deleted.' },
			'404': { description: 'The folder does not exist.', schema: errorSchema },
		},
	},
};

/**
 * Endpoint declarations for the folders REST resource.
 */
export interface FoldersEndpoints {
	index: RestEndpoint<undefined, unknown, FolderListResult, FolderListResult>;
	show: RestEndpoint<undefined, FolderIdPayload, FolderDetail, FolderDetail>;
	children: RestEndpoint<{ id: number }, unknown, FolderChildren, FolderChildren>;
	store: RestEndpoint<undefined, FolderCreatePayload, FolderCreateResult, FolderCreateResult>;
	update: RestEndpoint<undefined, FolderUpdatePayload, FolderRenameResult, FolderRenameResult>;
	destroy: RestEndpoint<undefined, FolderIdPayload, FolderDeleteResult, FolderDeleteResult>;
}

/**
 * Declarative folders REST resource.
 *
 * Owns the folders endpoint declarations consumed by the REST `handle`
 * adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/folders` controllers
 * reduce to one-line dispatch over `endpoints`.
 */
@inject()
export default class FoldersResource {
	constructor(
		protected listRootFoldersAction: ListRootFoldersAction,
		protected createFolderAction: CreateFolderAction,
		protected getFolderDetailAction: GetFolderDetailAction,
		protected listFolderChildrenAction: ListFolderChildrenAction,
		protected renameFolderAction: RenameFolderAction,
		protected deleteFolderAction: DeleteFolderAction,
	) {}

	readonly endpoints: FoldersEndpoints = {
		index: {
			execute: () => this.listRootFoldersAction.execute(),
			transform: (entity) => FileFolderTransformer.transform(entity),
			docs: foldersEndpointsDocs.index,
		},
		show: {
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.getFolderDetailAction.execute({ id: payload.id }),
			transform: (entity) => FileFolderTransformer.transform(entity),
			docs: foldersEndpointsDocs.show,
		},
		children: {
			prepare: async (context) => {
				const { id } = await showFileValidator.validate(context.params);

				return { id };
			},
			execute: async (_context, prepared) => {
				await this.getFolderDetailAction.execute({ id: prepared.id });

				return this.listFolderChildrenAction.execute({ parentId: prepared.id });
			},
			transform: (entity) => FileFolderTransformer.transform(entity),
			docs: foldersEndpointsDocs.children,
		},
		store: {
			status: 201,
			validator: () => createFolderValidator,
			execute: (_context, _prepared, payload) =>
				this.createFolderAction.execute({
					name: payload.name,
					parentId: payload.parentId ?? null,
				}),
			transform: (entity) => FileFolderTransformer.transform(entity.toDomain()),
			docs: foldersEndpointsDocs.store,
		},
		update: {
			input: (context) => ({
				id: Number(context.params.id),
				name: context.request.input('name'),
			}),
			validator: () => updateFolderValidator,
			execute: (_context, _prepared, payload) =>
				this.renameFolderAction.execute({ id: payload.id, name: payload.name }),
			transform: (entity) => FileFolderTransformer.transform(entity.toDomain()),
			docs: foldersEndpointsDocs.update,
		},
		destroy: {
			status: 204,
			input: (context) => context.params,
			validator: () => showFileValidator,
			execute: (_context, _prepared, payload) => this.deleteFolderAction.execute({ id: payload.id }),
			docs: foldersEndpointsDocs.destroy,
		},
	};
}
