import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { TOKEN_TYPES, type FullToken } from '#auth/enums/token_type';
import Token from '#auth/models/token';
import { TokenMailService } from '#auth/services/token_mail_service';
import { createVerifiedUser } from '#tests/helpers/create_verified_user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

/**
 * Unit seam for the password-reset split of the {@link TokenMailService}
 * (issue #286): the token is issued synchronously in the request
 * (`issuePasswordResetToken`) while the mail is sent later, by the queue
 * worker, from the pre-issued token (`sendPasswordResetMail`).
 */
test.group('TokenMailService password reset', () => {
	test('issuePasswordResetToken() persists a PASSWORD_RESET token and returns the full token', async ({ assert }) => {
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'issue_token@example.com', password: 'TestPassword123!' });

		const token = await service.issuePasswordResetToken(user);

		assert.match(token, /^\S+\.\S+$/);

		const record = await Token.query().where('type', TOKEN_TYPES.PASSWORD_RESET).where('user_id', user.id).first();
		assert.exists(record);
		assert.equal(record!.selector, token.split('.')[0]);
		assert.isAbove(record!.expiresAt!.toMillis(), Date.now());
	});

	test('issuePasswordResetToken() expires outstanding PASSWORD_RESET tokens of the user', async ({ assert }) => {
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'expire_token@example.com', password: 'TestPassword123!' });

		const first = await service.issuePasswordResetToken(user);
		const second = await service.issuePasswordResetToken(user);

		assert.notEqual(first, second);

		const firstRecord = await Token.query().where('selector', first.split('.')[0]).first();
		const secondRecord = await Token.query().where('selector', second.split('.')[0]).first();
		assert.exists(firstRecord);
		assert.exists(secondRecord);
		assert.isBelow(firstRecord!.expiresAt!.toMillis(), Date.now());
		assert.isAbove(secondRecord!.expiresAt!.toMillis(), Date.now());
	});

	test('sendPasswordResetMail() sends the mail built from the given token', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'mail_token@example.com', password: 'TestPassword123!' });

		const token = 'sent-selector.sent-validator' as FullToken;
		await service.sendPasswordResetMail(user, token);
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		assert.equal(mail.sent[0].to, user.email);
		assert.equal(mail.sent[0].template, 'emails/auth_email');
	});
});

/**
 * Payload pins of the spec-driven assembly (issue #340): the rendered mail of
 * every auth flow must stay byte-identical to the previous hand-assembled
 * payload. The link slot value depends on the runtime route table (uncommitted
 * in the unit environment), so only its type is asserted here — the functional
 * suites exercise the link itself.
 */
test.group('TokenMailService spec-driven payloads', () => {
	test('sendVerificationEmail() builds the mail from the emailVerification spec row', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'spec_verify@example.com', password: 'TestPassword123!' });

		await service.sendVerificationEmail(user);
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		const sent = mail.sent[0];
		assert.equal(sent.to, user.email);
		assert.equal(sent.subject, 'Verify your email address');
		assert.equal(sent.template, 'emails/auth_email');

		const { verification_link, ...data } = sent.data as Record<string, string>;
		assert.equal(typeof verification_link, 'string');
		assert.deepEqual(data, {
			locale: 'en',
			app_name: 'AdonisJS Foundry',
			subject: 'Verify your email address',
			greeting: 'Hello,',
			intro: 'Thank you for registering! Please verify your email address by clicking the button below.',
			action: 'Verify Email Address',
			outro: 'If you did not create an account, no further action is required.',
			expiry: 'This verification link will expire in 24 hour.',
			footer: "If you're having trouble clicking the button, copy and paste the URL below into your web browser:",
		});
	});

	test('sendPasswordResetMail() builds the mail from the passwordReset spec row', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'spec_reset@example.com', password: 'TestPassword123!' });

		await service.sendPasswordResetMail(user, 'spec-selector.spec-validator' as FullToken);
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		const sent = mail.sent[0];
		assert.equal(sent.to, user.email);
		assert.equal(sent.template, 'emails/auth_email');

		const { reset_link, ...data } = sent.data as Record<string, string>;
		assert.equal(typeof reset_link, 'string');
		// The spec row keeps the flow's existing key path
		// (`auth.reset_password.mail.*`), which is missing from the lang files —
		// `t()` therefore renders its missing-key marker. Pre-existing behavior,
		// pinned here so the refactor changes nothing; the missing keys are a
		// separate bug to fix on their own.
		assert.deepEqual(data, {
			locale: 'en',
			app_name: 'AdonisJS Foundry',
			subject: 'translation missing: en, auth.reset_password.mail.subject',
			greeting: 'translation missing: en, auth.reset_password.mail.greeting',
			intro: 'translation missing: en, auth.reset_password.mail.intro',
			action: 'translation missing: en, auth.reset_password.mail.action',
			outro: 'translation missing: en, auth.reset_password.mail.outro',
			expiry: 'translation missing: en, auth.reset_password.mail.expiry',
			footer: 'translation missing: en, auth.reset_password.mail.footer',
		});
	});

	test('sendInvitationEmail() builds the mail from the invitation spec row', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(TokenMailService);
		const user = await createVerifiedUser({ email: 'spec_invite@example.com', password: 'TestPassword123!' });

		await service.sendInvitationEmail(user);
		restoreMailClient();

		assert.equal(mail.sent.length, 1);
		const sent = mail.sent[0];
		assert.equal(sent.to, user.email);
		assert.equal(sent.subject, 'You have been invited to join AdonisJS Foundry');
		assert.equal(sent.template, 'emails/admin_invite_email');

		const { accept_link, ...data } = sent.data as Record<string, string>;
		assert.equal(typeof accept_link, 'string');
		assert.deepEqual(data, {
			locale: 'en',
			app_name: 'AdonisJS Foundry',
			subject: 'You have been invited to join AdonisJS Foundry',
			greeting: 'You have been invited,',
			intro:
				'An administrator has invited you to join AdonisJS Foundry. Click the button below to accept your invitation and set up your account.',
			action: 'Accept invitation',
			outro:
				'Once you’ve accepted, you’ll be able to set your password and start using your account straight away. Your email address will be verified automatically.',
			expiry: 'This invitation link will expire in 7 days.',
			footer: "If you're having trouble clicking the button, copy and paste the URL below into your web browser:",
		});
	});
});
