import { test } from '@japa/runner';
import { permissionCategoryKey } from '#transport/identity/helpers/permission_category';

test.group('permission_category', () => {
	test('permissionCategoryKey() strips the system i18n key prefix', ({ assert }) => {
		assert.equal(permissionCategoryKey('permissions.category.users'), 'users');
	});

	test('permissionCategoryKey() strips the prefix while keeping sub-categories', ({ assert }) => {
		assert.equal(permissionCategoryKey('permissions.category.content.pages'), 'content.pages');
	});

	test('permissionCategoryKey() returns custom plain names unchanged', ({ assert }) => {
		assert.equal(permissionCategoryKey('Billing'), 'Billing');
		assert.equal(permissionCategoryKey('custom category'), 'custom category');
	});
});
