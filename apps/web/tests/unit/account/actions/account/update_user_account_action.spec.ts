import app from '@adonisjs/core/services/app';
import hash from '@adonisjs/core/services/hash';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { UpdateUserAccountAction } from '#account/actions/account/update_user_account_action';
import InvalidCurrentPasswordException from '#auth/exceptions/invalid_current_password_exception';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import User from '#identity/models/user';
import { restoreMailClient, swapMailClient } from '#tests/helpers/mail';

test.group('UpdateUserAccountAction', () => {
	test('execute() throws UnverifiedAccountException if email not verified', async ({ assert }) => {
		const action = await app.container.make(UpdateUserAccountAction);
		const user = await User.create({
			email: 'unverified@test.com',
			username: 'unverified',
			password: 'pwd',
		});

		await assert.rejects(async () => {
			await action.execute({ user, email: 'new@test.com' });
		}, UnverifiedAccountException);
	});

	test('execute() throws InvalidCurrentPasswordException if current_password wrong', async ({ assert }) => {
		const action = await app.container.make(UpdateUserAccountAction);
		const user = await User.create({
			email: 'wrongpwd@test.com',
			username: 'wrongpwd',
			password: 'correct_password',
			emailVerifiedAt: DateTime.now(),
		});

		await assert.rejects(async () => {
			await action.execute({ user, currentPassword: 'wrong_password', password: 'new_password' });
		}, InvalidCurrentPasswordException);
	});

	test('execute() changes password if current_password correct', async ({ assert }) => {
		const action = await app.container.make(UpdateUserAccountAction);
		const user = await User.create({
			email: 'changepwd@test.com',
			username: 'changepwd',
			password: 'old_password',
			emailVerifiedAt: DateTime.now(),
		});

		const updated = await action.execute({
			user,
			currentPassword: 'old_password',
			password: 'new_password123',
		});

		assert.isTrue(await hash.verify(updated.password!, 'new_password123'));
	});

	test('execute() sets pendingEmail and sends the email-change mail pair when email changes', async ({ assert }) => {
		const mail = swapMailClient();
		const action = await app.container.make(UpdateUserAccountAction);

		const user = await User.create({
			email: 'changeemail@test.com',
			username: 'changeemail',
			password: 'pwd',
			emailVerifiedAt: DateTime.now(),
		});

		const updated = await action.execute({ user, email: 'new_email@test.com' });

		restoreMailClient();

		assert.equal(updated.email, 'changeemail@test.com');
		assert.equal(updated.pendingEmail, 'new_email@test.com');
		assert.equal(mail.sent.length, 2);
		// Confirmation mail goes to the new (pending) address, notification to the current one.
		assert.equal(mail.sent[0].to, 'new_email@test.com');
		assert.equal(mail.sent[1].to, 'changeemail@test.com');
	});
});
