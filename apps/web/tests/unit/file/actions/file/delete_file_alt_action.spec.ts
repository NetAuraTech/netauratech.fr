import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DeleteFileAltAction } from '#file/actions/file/delete_file_alt_action';
import CmsFile from '#file/models/file';
import FileAlt from '#file/models/file_alt';

test.group('DeleteFileAltAction', () => {
	test('execute() deletes the alt entry', async ({ assert }) => {
		const action = await app.container.make(DeleteFileAltAction);

		const file = await CmsFile.create({
			filename: 'delalt_file.jpg',
			originalName: 'photo_delalt.jpg',
			mimeType: 'image/jpeg',
			extension: 'jpg',
			size: 1024,
			path: 'cms/files/delalt_file.jpg',
			disk: 'fs',
		});

		await FileAlt.create({ fileId: file.id, locale: 'en', key: 'hero', value: 'Alt to delete' });

		await action.execute({ fileId: file.id, locale: 'en', key: 'hero' });

		const remaining = await FileAlt.query().where('fileId', file.id);
		assert.lengthOf(remaining, 0);
	});
});
