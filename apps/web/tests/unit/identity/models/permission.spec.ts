import { test } from '@japa/runner';
import Permission from '#identity/models/permission';

test.group('Permission Model', () => {
	test('canBeDeleted returns false for system permissions', ({ assert }) => {
		const permission = new Permission();
		permission.isSystem = true;
		assert.isFalse(permission.canBeDeleted);

		permission.isSystem = false;
		assert.isTrue(permission.canBeDeleted);
	});

	test('canBeModified returns false for system permissions', ({ assert }) => {
		const permission = new Permission();
		permission.isSystem = true;
		assert.isFalse(permission.canBeModified);

		permission.isSystem = false;
		assert.isTrue(permission.canBeModified);
	});
});
