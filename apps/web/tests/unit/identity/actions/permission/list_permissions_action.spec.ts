import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { ListPermissionsAction } from '#identity/actions/permission/list_permissions_action';
import Permission from '#identity/models/permission';

test.group('ListPermissionsAction', () => {
	test('execute() returns paginated permissions with optional search filter', async ({ assert }) => {
		const action = await app.container.make(ListPermissionsAction);

		await Permission.create({
			slug: 'search_perm_1',
			name: 'Unique Name One Perm',
			description: 'desc1',
			category: 'test_list_perm',
		});
		await Permission.create({
			slug: 'search_perm_2',
			name: 'Another Permission Two',
			description: 'Unique Desc Two Perm',
			category: 'test_list_perm',
		});

		let result = await action.execute({ pagination: { page: 1, perPage: 10 } });
		assert.isAbove(result.total, 1);

		result = await action.execute({
			search: 'Unique Name One',
			pagination: { page: 1, perPage: 10 },
		});
		assert.equal(result.total, 1);
		assert.equal(result.all()[0].slug, 'search_perm_1');

		result = await action.execute({
			search: 'Unique Desc Two',
			pagination: { page: 1, perPage: 10 },
		});
		assert.equal(result.total, 1);
		assert.equal(result.all()[0].slug, 'search_perm_2');
	});
});
