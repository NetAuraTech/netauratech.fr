import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DeleteUserAccountAction } from '#account/actions/account/delete_user_account_action';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import User from '#identity/models/user';

test.group('DeleteUserAccountAction', () => {
	test('execute() deletes the user account if password correct', async ({ assert }) => {
		const action = await app.container.make(DeleteUserAccountAction);

		const user = await User.create({
			email: 'delete_acct@test.com',
			username: 'delete_acct',
			password: 'password123',
		});

		const result = await action.execute({ user, password: 'password123' });

		assert.isTrue(result);
		const found = await User.find(user.id);
		assert.isNull(found);
	});

	test('execute() throws InvalidCurrentPasswordException if password wrong', async ({ assert }) => {
		const action = await app.container.make(DeleteUserAccountAction);

		const user = await User.create({
			email: 'delete_wrong@test.com',
			username: 'delete_wrong',
			password: 'password123',
		});

		await assert.rejects(async () => {
			await action.execute({ user, password: 'wrong_password' });
		}, InvalidCurrentPasswordException);
	});
});
