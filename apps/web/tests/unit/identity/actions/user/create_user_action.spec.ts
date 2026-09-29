import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { CreateUserAction } from '#identity/actions/user/create_user_action';
import User from '#identity/models/user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

test.group('CreateUserAction', () => {
	test('execute() creates a new user and sends the invitation mail', async ({ assert }) => {
		const mail = swapMailClient();

		const action = await app.container.make(CreateUserAction);

		const user = await action.execute({
			email: 'create_user@test.com',
		});

		restoreMailClient();

		assert.isNotNull(user.id);
		assert.equal(user.email, 'create_user@test.com');
		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, 'create_user@test.com');
	});

	test('execute() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
		const action = await app.container.make(CreateUserAction);
		await User.create({
			email: 'exists_create@test.com',
			username: 'exists_create',
			password: 'pwd',
		});

		let threw = false;
		try {
			await action.execute({ email: 'exists_create@test.com' });
		} catch (err: any) {
			threw = true;
			assert.equal(err.code, 'E_EMAIL_EXISTS');
		}
		assert.isTrue(threw);
	});
});
