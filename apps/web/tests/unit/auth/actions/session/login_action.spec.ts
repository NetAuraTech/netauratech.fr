import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { LoginAction } from '#auth/actions/session/login_action';
import User from '#identity/models/user';

test.group('LoginAction', () => {
	test('execute() returns user on valid credentials', async ({ assert }) => {
		const action = await app.container.make(LoginAction);
		const timestamp = Date.now();

		await User.create({
			email: `login${timestamp}@test.com`,
			username: `login_${timestamp}`,
			password: 'password123',
		});

		const user = await action.execute({
			email: `login${timestamp}@test.com`,
			password: 'password123',
		});

		assert.isNotNull(user.id);
		assert.equal(user.email, `login${timestamp}@test.com`);
	});

	test('execute() throws InvalidCredentialsException on wrong password', async ({ assert }) => {
		const action = await app.container.make(LoginAction);
		const timestamp = Date.now();

		await User.create({
			email: `wrongpwd${timestamp}@test.com`,
			username: `wrongpwd_${timestamp}`,
			password: 'password123',
		});

		let threw = false;
		try {
			await action.execute({
				email: `wrongpwd${timestamp}@test.com`,
				password: 'bad-password',
			});
		} catch (err: any) {
			threw = true;
			assert.equal(err.code, 'E_INVALID_CREDENTIALS');
		}
		assert.isTrue(threw);
	});

	test('execute() throws InvalidCredentialsException on nonexistent email', async ({ assert }) => {
		const action = await app.container.make(LoginAction);

		let threw = false;
		try {
			await action.execute({
				email: 'nonexistent@test.com',
				password: 'password123',
			});
		} catch (err: any) {
			threw = true;
			assert.equal(err.code, 'E_INVALID_CREDENTIALS');
		}
		assert.isTrue(threw);
	});
});
