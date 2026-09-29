import { test } from '@japa/runner';
import UserPreference from '#account/models/user_preference';

test.group('UserPreference Model', () => {
	test('can instantiate a user preference model', async ({ assert }) => {
		const pref = new UserPreference();
		pref.theme = 'light';
		pref.locale = 'en';
		assert.equal(pref.theme, 'light');
		assert.equal(pref.locale, 'en');
	});
});
