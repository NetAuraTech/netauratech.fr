import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { InvitationService } from '#auth/services/invitation_service';
import User from '#identity/models/user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

test.group('InvitationService', () => {
	test('sendInvitation() creates a pending user and sends the invitation mail', async ({ assert }) => {
		const mail = swapMailClient();

		const service = await app.container.make(InvitationService);
		const user = await service.sendInvitation({ email: 'svc_invite_me@test.com' });

		restoreMailClient();

		assert.isNotNull(user.id);
		assert.equal(user.email, 'svc_invite_me@test.com');
		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, 'svc_invite_me@test.com');
	});

	test('sendInvitation() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
		const service = await app.container.make(InvitationService);
		await User.create({
			email: 'svc_invite_exists@test.com',
			username: 'svc_invite_exists',
			password: 'pwd',
		});

		let threw = false;
		try {
			await service.sendInvitation({ email: 'svc_invite_exists@test.com' });
		} catch (err: any) {
			threw = true;
			assert.equal(err.code, 'E_EMAIL_EXISTS');
		}
		assert.isTrue(threw);
	});
});
