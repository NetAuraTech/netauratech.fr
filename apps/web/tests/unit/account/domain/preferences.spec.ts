import { test } from '@japa/runner';
import { UserPreference } from '#account/domain/preferences';
import { DEFAULT_PREFERENCES } from '#account/types/preferences';

/**
 * Unit tests for the {@link UserPreference} domain value object.
 */
test.group('UserPreference', () => {
	test('fromModel() resolves the stored theme and locale', ({ assert }) => {
		const preference = UserPreference.fromModel({ theme: 'dark', locale: 'fr' });

		assert.equal(preference.theme, 'dark');
		assert.equal(preference.locale, 'fr');
	});

	test('fromModel() falls back to the defaults for absent values', ({ assert }) => {
		const preference = UserPreference.fromModel({ theme: null, locale: null });

		assert.equal(preference.theme, DEFAULT_PREFERENCES.theme);
		assert.equal(preference.locale, DEFAULT_PREFERENCES.locale);
	});

	test('fromModel() resolves a missing row to the defaults', ({ assert }) => {
		const preference = UserPreference.fromModel(null);

		assert.equal(preference.theme, DEFAULT_PREFERENCES.theme);
		assert.equal(preference.locale, DEFAULT_PREFERENCES.locale);
	});

	test('toPreferences() produces the plain frontend shape', ({ assert }) => {
		const preference = UserPreference.fromModel({ theme: 'light', locale: 'en' });

		assert.deepEqual(preference.toPreferences(), { theme: 'light', locale: 'en' });
	});

	test('equals() compares values, as a value object without identity', ({ assert }) => {
		const a = UserPreference.fromModel({ theme: 'dark', locale: 'fr' });
		const b = UserPreference.defaults();

		assert.isTrue(a.equals(UserPreference.fromModel({ theme: 'dark', locale: 'fr' })));
		assert.isFalse(a.equals(b));
	});
});
