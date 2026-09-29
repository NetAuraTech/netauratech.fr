import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { MoveFileAction } from '#file/actions/file/move_file_action';
import CmsFile from '#file/models/file';
import FileFolder from '#file/models/file_folder';

test.group('MoveFileAction', () => {
	test('execute() updates folderId without touching the physical file', async ({ assert }) => {
		const action = await app.container.make(MoveFileAction);

		const file = await CmsFile.create({
			filename: 'move_file.jpg',
			originalName: 'photo_move.jpg',
			mimeType: 'image/jpeg',
			extension: 'jpg',
			size: 1024,
			path: 'cms/files/move_file.jpg',
			disk: 'fs',
		});

		const folder = await FileFolder.create({ name: 'move_target_folder' });

		const updated = await action.execute({ id: file.id, folderId: folder.id });
		assert.equal(updated.folderId, folder.id);
	});

	test('execute() accepts null to move file to root', async ({ assert }) => {
		const action = await app.container.make(MoveFileAction);

		const folder = await FileFolder.create({ name: 'move_source_folder' });
		const file = await CmsFile.create({
			filename: 'move_root.jpg',
			originalName: 'photo_root.jpg',
			mimeType: 'image/jpeg',
			extension: 'jpg',
			size: 1024,
			path: 'cms/files/move_root.jpg',
			disk: 'fs',
			folderId: folder.id,
		});

		const updated = await action.execute({ id: file.id, folderId: null });
		assert.isNull(updated.folderId);
	});
});
