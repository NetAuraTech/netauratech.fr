import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { DeletePermissionAction } from '#identity/actions/permission/delete_permission_action';
import SystemPermissionImmutableException from '#identity/exceptions/system_permission_immutable_exception';
import Permission from '#identity/models/permission';

test.group('DeletePermissionAction', () => {
	test('execute() deletes a custom permission', async ({ assert }) => {
		const action = await app.container.make(DeletePermissionAction);
		const permission = await Permission.create({
			name: 'Spec Delete Permission',
			slug: 'spec_delete_permission',
			category: 'spec',
		});

		const result = await action.execute({ id: permission.id });

		assert.isTrue(result);
		assert.isNull(await Permission.find(permission.id));
	});

	test('execute() throws RowNotFoundException when permission does not exist', async ({ assert }) => {
		const action = await app.container.make(DeletePermissionAction);

		await assert.rejects(() => action.execute({ id: 999999 }), RowNotFoundException);
	});

	test('execute() throws SystemPermissionImmutableException on system permission', async ({ assert }) => {
		const action = await app.container.make(DeletePermissionAction);
		const permission = await Permission.create({
			name: 'Spec Delete System Permission',
			slug: 'spec_delete_system_permission',
			category: 'spec',
			isSystem: true,
		});

		await assert.rejects(() => action.execute({ id: permission.id }), SystemPermissionImmutableException);
	});
});
