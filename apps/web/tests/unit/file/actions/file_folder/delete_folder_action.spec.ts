import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DeleteFolderAction } from '#file/actions/file_folder/delete_folder_action';
import FileFolder from '#file/models/file_folder';

test.group('DeleteFolderAction', () => {
	test('execute() deletes the folder', async ({ assert }) => {
		const action = await app.container.make(DeleteFolderAction);

		const folder = await FileFolder.create({ name: 'delete_folder_test' });

		const result = await action.execute({ id: folder.id });

		assert.isTrue(result);
		const found = await FileFolder.find(folder.id);
		assert.isNull(found);
	});
});
