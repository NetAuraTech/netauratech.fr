import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import RowNotFoundException from '#core/exceptions/row_not_found_exception';
import { DeleteUserAction } from '#identity/actions/user/delete_user_action';
import User from '#identity/models/user';

test.group('DeleteUserAction', () => {
	test('execute() removes the user', async ({ assert }) => {
		const action = await app.container.make(DeleteUserAction);
		const user = await User.create({
			email: 'delete_user@test.com',
			username: 'delete_user',
			password: 'pwd',
		});

		const result = await action.execute({ id: user.id });

		assert.isTrue(result);
		const found = await User.find(user.id);
		assert.isNull(found);
	});

	test('execute() throws RowNotFoundException if user does not exist', async ({ assert }) => {
		const action = await app.container.make(DeleteUserAction);

		await assert.rejects(async () => {
			await action.execute({ id: 999999 });
		}, RowNotFoundException);
	});
});
