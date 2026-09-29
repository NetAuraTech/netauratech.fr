import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { ListAllPermissionsAction } from '#identity/actions/permission/list_all_permissions_action';
import Permission from '#identity/models/permission';

test.group('ListAllPermissionsAction', () => {
	test('execute() returns all permissions sorted by name', async ({ assert }) => {
		const action = await app.container.make(ListAllPermissionsAction);

		await Permission.create({ slug: 'z_perm_all', name: 'Z Permission All', category: 'test_all' });
		await Permission.create({ slug: 'a_perm_all', name: 'A Permission All', category: 'test_all' });

		const permissions = await action.execute();

		assert.isAbove(permissions.length, 1);
		const aIndex = permissions.findIndex((p) => p.slug === 'a_perm_all');
		const zIndex = permissions.findIndex((p) => p.slug === 'z_perm_all');
		assert.isBelow(aIndex, zIndex);
	});
});
