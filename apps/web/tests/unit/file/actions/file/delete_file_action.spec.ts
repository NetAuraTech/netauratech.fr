import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DeleteFileAction } from '#file/actions/file/delete_file_action';
import CmsFile from '#file/models/file';

test.group('DeleteFileAction', () => {
	test('execute() deletes the file record', async ({ assert }) => {
		const action = await app.container.make(DeleteFileAction);

		const file = await CmsFile.create({
			filename: 'delete_file.jpg',
			originalName: 'photo_delete.jpg',
			mimeType: 'image/jpeg',
			extension: 'jpg',
			size: 1024,
			path: 'cms/files/delete_file.jpg',
			disk: 'fs',
		});

		const result = await action.execute({ id: file.id });
		assert.isTrue(result);
	});

	test('execute() throws when file not found', async ({ assert }) => {
		const action = await app.container.make(DeleteFileAction);

		await assert.rejects(async () => {
			await action.execute({ id: 999999 });
		});
	});
});
