import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { DefineSocialPasswordAction } from '#auth/actions/social/define_social_password_action';
import User from '#identity/models/user';

test.group('DefineSocialPasswordAction', () => {
	test('execute() updates the user password for a social-only user', async ({ assert }) => {
		const action = await app.container.make(DefineSocialPasswordAction);

		const user = await User.create({
			email: 'social_pw@test.com',
			username: 'social_pw',
			githubId: 'github_123',
		});

		await action.execute({ user, password: 'SecretPassword123!' });

		await user.refresh();
		assert.isTrue(user.password !== null);
	});
});
