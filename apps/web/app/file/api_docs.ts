import vine from '@vinejs/vine';
import { registerApiDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import {
	dateTime,
	errorSchema,
	validationErrorSchema,
	dataEnvelope,
	paginatedEnvelope,
} from '#transport/core/openapi/schemas';
import {
	listFileValidator,
	showFileValidator,
	moveFileValidator,
	upsertAltValidator,
	deleteAltValidator,
	createFolderValidator,
	updateFolderValidator,
} from '#transport/file/validators/file';

/** The alt-text entry of a file. */
const altEntrySchema: JsonSchema = {
	type: 'object',
	properties: {
		locale: { type: 'string' },
		key: { type: 'string' },
		value: { type: 'string' },
	},
};

/** The file payload, as shaped by `FileTransformer` (lean admin/API shape). */
const fileSchema: JsonSchema = {
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
		width: { type: 'number', nullable: true },
		height: { type: 'number', nullable: true },
		variants: { type: 'array', nullable: true },
	},
};

/** The folder node, as shaped by `FileFolderTransformer` (children are nested trees). */
const folderSchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number' },
		name: { type: 'string' },
		parentId: { type: 'number', nullable: true },
		children: { type: 'array', items: { type: 'object' } },
	},
};

/**
 * The file-upload body: a multipart form with the required `file` field and
 * an optional target `folder_id`. The endpoint reads the multipart request
 * directly (no Vine validator), so this mirror documents its contract.
 */
const uploadFileBodyValidator = vine.create({
	file: vine.string().minLength(1),
	folder_id: vine.number().positive().optional(),
});

/**
 * Register the docs metadata of the file REST surface (files, folders)
 * under their full route names.
 *
 * Called from `app/file/controllers/api/routes.ts` at import time, alongside
 * the routes they document, so the docs and the routes live or die together.
 * Request schemas are derived from the very same validators the endpoints
 * execute, keeping the documented shape in lockstep with the enforced one.
 */
export function registerFileApiDocs(): void {
	// Files
	registerApiDoc('api.v1.admin.file.files.index', {
		summary: 'List files',
		description: 'Paginated file listing, filterable by folder, MIME type and search term.',
		tags: ['Files'],
		request: [{ validator: listFileValidator, in: 'query' }],
		paginated: true,
		responses: {
			'200': { description: 'The paginated file list.', schema: paginatedEnvelope(fileSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.files.store', {
		summary: 'Upload a file',
		description: 'Multipart form with a required `file` field and an optional `folder_id` target.',
		tags: ['Files'],
		request: [{ validator: uploadFileBodyValidator, in: 'body', contentType: 'multipart/form-data' }],
		responses: {
			'201': { description: 'The uploaded file.', schema: dataEnvelope(fileSchema) },
			'400': { description: 'The `file` field is missing.', schema: errorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.files.show', {
		summary: 'Show a file',
		tags: ['Files'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'200': { description: 'The file.', schema: dataEnvelope(fileSchema) },
			'404': { description: 'The file does not exist.', schema: errorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.files.move', {
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
	});

	registerApiDoc('api.v1.admin.file.files.destroy', {
		summary: 'Delete a file',
		tags: ['Files'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'204': { description: 'The file was deleted.' },
			'404': { description: 'The file does not exist.', schema: errorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.files.upsert_alt', {
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
	});

	registerApiDoc('api.v1.admin.file.files.delete_alt', {
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
	});

	// Folders
	registerApiDoc('api.v1.admin.file.folders.index', {
		summary: 'List root folders',
		tags: ['Folders'],
		responses: {
			'200': {
				description: 'The root folder tree.',
				schema: dataEnvelope({ type: 'array', items: folderSchema }),
			},
		},
	});

	registerApiDoc('api.v1.admin.file.folders.store', {
		summary: 'Create a folder',
		tags: ['Folders'],
		request: [{ validator: createFolderValidator, in: 'body' }],
		responses: {
			'201': { description: 'The created folder.', schema: dataEnvelope(folderSchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.folders.show', {
		summary: 'Show a folder',
		tags: ['Folders'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'200': { description: 'The folder tree.', schema: dataEnvelope(folderSchema) },
			'404': { description: 'The folder does not exist.', schema: errorSchema },
		},
	});

	registerApiDoc('api.v1.admin.file.folders.children', {
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
	});

	registerApiDoc('api.v1.admin.file.folders.update', {
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
	});

	registerApiDoc('api.v1.admin.file.folders.destroy', {
		summary: 'Delete a folder',
		tags: ['Folders'],
		request: [{ validator: showFileValidator, in: 'path' }],
		responses: {
			'204': { description: 'The folder was deleted.' },
			'404': { description: 'The folder does not exist.', schema: errorSchema },
		},
	});
}
