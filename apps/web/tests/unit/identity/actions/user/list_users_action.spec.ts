import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { ListUsersAction } from '#identity/actions/user/list_users_action';
import Role from '#identity/models/role';
import User from '#identity/models/user';

test.group('ListUsersAction', () => {
	test('execute() returns paginated users with optional filters', async ({ assert }) => {
		const action = await app.container.make(ListUsersAction);
		const role1 = await Role.create({ slug: 'role1_listusers', name: 'Role 1' });
		const role2 = await Role.create({ slug: 'role2_listusers', name: 'Role 2' });

		await User.create({ email: 'u1@test.com', username: 'u1', password: 'pwd', roleId: role1.id });
		await User.create({ email: 'u2@test.com', username: 'u2', password: 'pwd', roleId: role2.id });

		let result = await action.execute({
			role: String(role1.id),
			pagination: { page: 1, perPage: 10 },
		});
		assert.equal(result.total, 1);
		assert.equal(result.all()[0].username, 'u1');

		result = await action.execute({ search: 'u2', pagination: { page: 1, perPage: 10 } });
		assert.equal(result.total, 1);
		assert.equal(result.all()[0].email, 'u2@test.com');
	});
});
