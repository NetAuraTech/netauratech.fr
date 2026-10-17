import { test } from '@japa/runner';
import sinon from 'sinon';
import { File } from '#file/domain/file';
import { FileFolder } from '#file/domain/file_folder';
import { StorageService } from '#file/services/storage_service';
import { pinDrift, pinEnvelope, serializePayload } from '#tests/helpers/openapi_drift';
import { dataEnvelope } from '#transport/core/openapi/schemas';
import { fileSchema } from '#transport/file/rest/files_resource';
import { folderSchema } from '#transport/file/rest/folders_resource';
import FileFolderTransformer from '#transport/file/transformers/file_folder_transformer';
import FileTransformer from '#transport/file/transformers/file_transformer';

const now = new Date('2026-01-15T10:00:00.000Z');

function makeFile(): File {
	return File.fromModel({
		id: 1,
		filename: 'hero.jpg',
		originalName: 'photo.jpg',
		mimeType: 'image/jpeg',
		extension: 'jpg',
		size: 2048,
		path: 'cms/files/hero.jpg',
		disk: 'fs',
		folderId: null,
		alts: [{ locale: 'en', key: 'hero', value: 'Hero alt' }],
		createdAt: now,
	});
}

/** A two-level folder tree, as hydrated by the repository. */
function makeFolderTree(): FileFolder {
	const nested = FileFolder.fromModel({ id: 2, name: 'Nested', parentId: 1 });
	return FileFolder.fromModel({ id: 1, name: 'Root', parentId: null }, [nested]);
}

test.group('OpenAPI drift — file schemas', (group) => {
	group.each.setup(() => {
		sinon.stub(StorageService.prototype, 'url').resolves('https://cdn.example.com/hero.jpg');
	});

	group.each.teardown(() => sinon.restore());

	test('lean file payload is pinned to fileSchema', async () => {
		const payload = await serializePayload(await new FileTransformer(makeFile()).toObject());

		pinDrift(fileSchema, payload, 'file');
	});

	test('file show envelope conforms to the documented envelope', async () => {
		const payload = await serializePayload(await new FileTransformer(makeFile()).toObject());

		pinEnvelope(dataEnvelope(fileSchema), { data: payload }, 'file show envelope');
	});

	test('folder tree payload is pinned to folderSchema', async () => {
		const payload = await serializePayload(await new FileFolderTransformer(makeFolderTree()).toObject());

		pinDrift(folderSchema, payload, 'folder');
	});

	test('folder show envelope conforms to the documented envelope', async () => {
		const payload = await serializePayload(await new FileFolderTransformer(makeFolderTree()).toObject());

		pinEnvelope(dataEnvelope(folderSchema), { data: payload }, 'folder show envelope');
	});

	test('a dropped documented field is rejected', async ({ assert }) => {
		const payload = await serializePayload(await new FileTransformer(makeFile()).toObject());
		delete payload.size;

		assert.throws(() => pinDrift(fileSchema, payload, 'file'), /missing from payload: \[size\]/);
	});
});
