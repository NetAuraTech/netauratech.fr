import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import SlugExistsException from '#core/exceptions/slug_exists_exception';
import { CreateRoleAction } from '#identity/actions/role/create_role_action';
import Permission from '#identity/models/permission';
import Role from '#identity/models/role';

test.group('CreateRoleAction', () => {
	test('execute() creates a role with synced permissions', async ({ assert }) => {
		const action = await app.container.make(CreateRoleAction);

		const perm1 = await Permission.create({
			slug: 'spec_create_role_perm_1',
			name: 'Spec Create Role Perm 1',
			category: 'spec',
		});
		const perm2 = await Permission.create({
			slug: 'spec_create_role_perm_2',
			name: 'Spec Create Role Perm 2',
			category: 'spec',
		});

		const role = await action.execute({
			name: 'Spec Create Role',
			slug: 'spec_create_role',
			description: 'Created by spec',
			permissionIds: [perm1.id, perm2.id],
		});

		assert.isNotNull(role.id);
		assert.isFalse(role.isSystem);
		assert.lengthOf(role.permissions, 2);
	});

	test('execute() throws SlugExistsException when slug is already taken', async ({ assert }) => {
		const action = await app.container.make(CreateRoleAction);
		await Role.create({ name: 'Spec Create Role Dup', slug: 'spec_create_role_dup' });

		await assert.rejects(
			() => action.execute({ name: 'Other', slug: 'spec_create_role_dup', description: null }),
			SlugExistsException,
		);
	});
});
