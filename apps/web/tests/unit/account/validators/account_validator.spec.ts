import { test } from '@japa/runner';
import User from '#identity/models/user';
import {
	updateEmailValidator,
	updatePasswordValidator,
	deleteAccountValidator,
	changeEmailValidator,
} from '#transport/account/validators/account';

test.group('Account Validators', () => {
	test('updateEmailValidator requires unique email except for self', async ({ assert }) => {
		const user1 = await User.create({
			email: 'user1@example.com',
			username: 'user1',
			password: 'pwd',
		});
		await User.create({
			email: 'user2@example.com',
			username: 'user2',
			password: 'pwd',
		});

		const validator = updateEmailValidator(user1.id);

		// Should reject if using user2's email
		await assert.rejects(() =>
			validator.validate({
				email: 'user2@example.com',
			}),
		);

		// Should accept user1's own email
		let result = await validator.validate({
			email: 'user1@example.com',
		});
		assert.equal(result.email, 'user1@example.com');

		// Should accept completely new email
		result = await validator.validate({
			email: 'newemail@example.com',
		});
		assert.equal(result.email, 'newemail@example.com');
	});

	test('updatePasswordValidator requires current password and confirmed new password', async ({ assert }) => {
		// Missing confirmation
		await assert.rejects(() =>
			updatePasswordValidator.validate({
				current_password: 'old-password',
				password: 'new-password',
			}),
		);

		// Valid
		const result = await updatePasswordValidator.validate({
			current_password: 'old-password',
			password: 'new-password123',
			password_confirmation: 'new-password123',
		});

		assert.equal(result.current_password, 'old-password');
		assert.equal(result.password, 'new-password123');
	});

	test('deleteAccountValidator requires password', async ({ assert }) => {
		await assert.rejects(() => deleteAccountValidator.validate({}));

		const result = await deleteAccountValidator.validate({ password: 'my-password' });
		assert.equal(result.password, 'my-password');
	});

	test('changeEmailValidator requires token', async ({ assert }) => {
		await assert.rejects(() => changeEmailValidator.validate({}));

		const result = await changeEmailValidator.validate({ token: ' MY-TOKEN ' });
		assert.equal(result.token, 'my-token'); // It trims and lowercases
	});
});
