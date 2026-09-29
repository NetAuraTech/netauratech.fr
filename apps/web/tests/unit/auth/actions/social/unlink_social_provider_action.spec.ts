import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { UnlinkSocialProviderAction } from '#auth/actions/social/unlink_social_provider_action';
import User from '#identity/models/user';

test.group('UnlinkSocialProviderAction', () => {
	test('execute() removes the provider association', async ({ assert }) => {
		const action = await app.container.make(UnlinkSocialProviderAction);

		const user = await User.create({
			email: 'unlink@test.com',
			username: 'unlink',
			facebookId: 'fb_123_unlink',
		});

		await action.execute({ user, provider: 'facebook' });

		await user.refresh();
		assert.isNull(user.facebookId);
	});
});
