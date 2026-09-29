import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { SendInvitationAction } from '#auth/actions/invitation/send_invitation_action';
import User from '#identity/models/user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

test.group('SendInvitationAction', () => {
	test('execute() creates a pending user and sends the invitation mail', async ({ assert }) => {
		const mail = swapMailClient();

		const action = await app.container.make(SendInvitationAction);
		const user = await action.execute({ email: 'invite_me@test.com' });

		restoreMailClient();

		assert.isNotNull(user.id);
		assert.equal(user.email, 'invite_me@test.com');
		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, 'invite_me@test.com');
	});

	test('execute() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
		const action = await app.container.make(SendInvitationAction);
		await User.create({
			email: 'invite_exists@test.com',
			username: 'invite_exists',
			password: 'pwd',
		});

		let threw = false;
		try {
			await action.execute({ email: 'invite_exists@test.com' });
		} catch (err: any) {
			threw = true;
			assert.equal(err.code, 'E_EMAIL_EXISTS');
		}
		assert.isTrue(threw);
	});
});
