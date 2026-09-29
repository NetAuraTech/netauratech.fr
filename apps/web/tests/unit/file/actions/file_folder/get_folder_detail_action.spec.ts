import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { GetFolderDetailAction } from '#file/actions/file_folder/get_folder_detail_action';
import FileFolder from '#file/models/file_folder';

test.group('GetFolderDetailAction', () => {
	test('execute() returns an existing folder', async ({ assert }) => {
		const action = await app.container.make(GetFolderDetailAction);

		const folder = await FileFolder.create({ name: 'detail_test' });

		const found = await action.execute({ id: folder.id });
		assert.equal(found.id, folder.id);
	});

	test('execute() throws RowNotFoundException for an unknown id', async ({ assert }) => {
		const action = await app.container.make(GetFolderDetailAction);

		await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException);
	});
});
