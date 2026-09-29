import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { UpdatePreferencesAction } from '#account/actions/preferences/update_preferences_action';
import User from '#identity/models/user';

test.group('UpdatePreferencesAction', () => {
	test('execute() upserts preferences and returns updated values', async ({ assert }) => {
		const action = await app.container.make(UpdatePreferencesAction);
		const user = await User.create({
			email: 'pref_user_update@test.com',
			username: 'pref_user_update',
		});

		let prefs = await action.execute({ user, data: { theme: 'dark' } });
		assert.equal(prefs.theme, 'dark');

		prefs = await action.execute({ user, data: { locale: 'fr' } });
		assert.equal(prefs.theme, 'dark');
		assert.equal(prefs.locale, 'fr');
	});
});
