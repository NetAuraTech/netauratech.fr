import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { GetUserDetailAction } from '#identity/actions/user/get_user_detail_action';
import Role from '#identity/models/role';
import User from '#identity/models/user';

test.group('GetUserDetailAction', () => {
	test('execute() throws RowNotFoundException if user does not exist', async ({ assert }) => {
		const action = await app.container.make(GetUserDetailAction);

		await assert.rejects(async () => {
			await action.execute({ id: 999999 });
		}, RowNotFoundException);
	});

	test('execute() returns user with role and permissions loaded', async ({ assert }) => {
		const action = await app.container.make(GetUserDetailAction);
		const role = await Role.create({ slug: 'detail_role_user', name: 'Detail Role' });
		const user = await User.create({
			email: 'detail@test.com',
			username: 'detail',
			password: 'pwd',
			roleId: role.id,
		});

		const result = await action.execute({ id: user.id });
		assert.equal(result.id.value, user.id);
		assert.isNotNull(result.role);
		assert.equal(result.role!.slug, 'detail_role_user');
	});
});
