import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DateTime } from 'luxon';
import { UpdateUserProfileAction } from '#account/actions/profile/update_user_profile_action';
import UnverifiedAccountException from '#auth/exceptions/unverified_account_exception';
import User from '#identity/models/user';

test.group('UpdateUserProfileAction', () => {
	test('execute() throws UnverifiedAccountException if email not verified', async ({ assert }) => {
		const action = await app.container.make(UpdateUserProfileAction);

		const user = await User.create({
			email: 'profile_unverified@test.com',
			username: 'profile_unverif',
		});
		assert.isFalse(user.isEmailVerified);

		await assert.rejects(async () => {
			await action.execute({ user, username: 'new_username' });
		}, UnverifiedAccountException);
	});

	test('execute() updates the user profile and returns updated user', async ({ assert }) => {
		const action = await app.container.make(UpdateUserProfileAction);

		const user = await User.create({
			email: 'profile_verified@test.com',
			username: 'old_username',
			emailVerifiedAt: DateTime.now(),
		});
		assert.isTrue(user.isEmailVerified);

		const updated = await action.execute({ user, username: 'new_username' });

		assert.equal(updated.id, user.id);
		assert.equal(updated.username, 'new_username');
	});
});
