import { test } from '@japa/runner';
import User from '#identity/models/user';
import { profileValidator } from '#transport/account/validators/profile';

test.group('Profile Validators', () => {
	test('profileValidator requires unique username except for self', async ({ assert }) => {
		const user1 = await User.create({
			email: 'profile_user1@example.com',
			username: 'profile_user1',
			password: 'pwd',
		});
		await User.create({
			email: 'profile_user2@example.com',
			username: 'profile_user2',
			password: 'pwd',
		});

		const validator = profileValidator(user1.id);

		// Should reject if using user2's username
		await assert.rejects(() =>
			validator.validate({
				username: 'profile_user2',
			}),
		);

		// Should accept user1's own username
		let result = await validator.validate({
			username: 'profile_user1',
		});
		assert.equal(result.username, 'profile_user1');

		// Should accept new unique username
		result = await validator.validate({
			username: 'profile_new_username',
		});
		assert.equal(result.username, 'profile_new_username');
	});
});
