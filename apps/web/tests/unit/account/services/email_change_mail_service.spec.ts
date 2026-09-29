import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { EmailChangeMailService } from '#account/services/email_change_mail_service';
import { Token } from '#auth/domain/token';
import { TOKEN_TYPES } from '#auth/enums/token_type';
import TokenModel from '#auth/models/token';
import { TokenRepository } from '#auth/repositories/token_repository';
import User from '#identity/models/user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

test.group('EmailChangeMailService', () => {
	test('sendEmailChangeMails() issues a token and sends confirmation + notification mails', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(EmailChangeMailService);
		const user = await User.create({
			email: 'emailchange_svc@test.com',
			username: 'emailchange_svc',
			password: 'pwd',
			emailVerifiedAt: DateTime.now(),
			pendingEmail: 'new_emailchange_svc@test.com',
		});

		await service.sendEmailChangeMails(user);

		restoreMailClient();

		// Confirmation goes to the pending address, notification to the current one.
		assert.equal(mail.sent.length, 2);
		assert.equal(mail.sent[0].to, 'new_emailchange_svc@test.com');
		assert.equal(mail.sent[1].to, 'emailchange_svc@test.com');

		const tokens = await TokenModel.query().where('user_id', user.id).where('type', TOKEN_TYPES.EMAIL_CHANGE);
		assert.equal(tokens.length, 1);
	});

	test('sendEmailChangeMails() expires outstanding email-change tokens before issuing a fresh one', async ({
		assert,
	}) => {
		swapMailClient();
		const service = await app.container.make(EmailChangeMailService);
		const tokenRepo = await app.container.make(TokenRepository);
		const user = await User.create({
			email: 'emailchange_seed@test.com',
			username: 'emailchange_seed',
			password: 'pwd',
			emailVerifiedAt: DateTime.now(),
			pendingEmail: 'new_emailchange_seed@test.com',
		});

		// Seed an outstanding (valid) email-change token.
		const { selector: seedSelector, validator: seedValidator } = Token.generateSplit();
		const seedHashed = await hash.make(seedValidator);
		await tokenRepo.create({
			userId: user.id,
			type: TOKEN_TYPES.EMAIL_CHANGE,
			selector: seedSelector,
			token: seedHashed,
			expiresAt: DateTime.now().plus({ hours: 1 }),
		});

		await service.sendEmailChangeMails(user);
		restoreMailClient();

		// The seeded token is expired and a fresh one was issued: two records total.
		const records = await TokenModel.query().where('user_id', user.id).where('type', TOKEN_TYPES.EMAIL_CHANGE);
		assert.equal(records.length, 2);
		assert.isNull(await tokenRepo.findBySelector(seedSelector, TOKEN_TYPES.EMAIL_CHANGE));
	});
});

/**
 * Payload pins of the spec-driven assembly (issue #340): both mails of the
 * email-change flow must stay byte-identical to the previous hand-assembled
 * payloads. The confirmation link value depends on the runtime route table
 * (uncommitted in the unit environment), so only its type is asserted here.
 */
test.group('EmailChangeMailService spec-driven payloads', () => {
	test('sendEmailChangeMails() builds both mails from their spec rows', async ({ assert }) => {
		const mail = swapMailClient();
		const service = await app.container.make(EmailChangeMailService);
		const user = await User.create({
			email: 'spec_emailchange@test.com',
			username: 'spec_emailchange',
			password: 'pwd',
			emailVerifiedAt: DateTime.now(),
			pendingEmail: 'new_spec_emailchange@test.com',
		});

		await service.sendEmailChangeMails(user);
		restoreMailClient();

		assert.equal(mail.sent.length, 2);

		const confirm = mail.sent[0];
		assert.equal(confirm.to, 'new_spec_emailchange@test.com');
		assert.equal(confirm.subject, 'Confirm your email address change');
		assert.equal(confirm.template, 'emails/account_email');

		const { confirmation_link, ...confirmData } = confirm.data as Record<string, string>;
		assert.equal(typeof confirmation_link, 'string');
		assert.deepEqual(confirmData, {
			locale: 'en',
			app_name: 'AdonisJS Foundry',
			subject: 'Confirm your email address change',
			greeting: 'Hello,',
			intro:
				'You have requested to change your email address to new_spec_emailchange@test.com. Please confirm this change by clicking the button below.',
			action: 'Confirm Email Change',
			outro: 'If you did not request this change, please ignore this email.',
			expiry: 'This confirmation link will expire in 24 hour.',
			footer: "If you're having trouble clicking the button, copy and paste the URL below into your web browser:",
		});

		const notification = mail.sent[1];
		assert.equal(notification.to, 'spec_emailchange@test.com');
		assert.equal(notification.subject, 'Your email address is being changed');
		assert.equal(notification.template, 'emails/account_email');
		assert.deepEqual(notification.data as Record<string, string>, {
			locale: 'en',
			app_name: 'AdonisJS Foundry',
			subject: 'Your email address is being changed',
			greeting: 'Hello,',
			intro:
				'This email is to notify you that your account email address is being changed from spec_emailchange@test.com to new_spec_emailchange@test.com.',
			action: 'If you need assistance, please contact us at:',
			warning:
				'If you did not initiate this change, your account may be compromised. Please contact our support team immediately.',
			support: 'contact@example.com',
		});
	});
});
