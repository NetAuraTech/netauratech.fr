import { test } from '@japa/runner';
import UserPreference from '#account/models/user_preference';
import { GetUserPreferenceQuery } from '#account/queries/get_user_preference_query';
import { PreferencesRepository } from '#account/repositories/preferences_repository';
import { UserFactory } from '#factories/identity/user_factory';

test.group('PreferencesRepository', () => {
	const repo = new PreferencesRepository();
	const query = new GetUserPreferenceQuery();

	const uniqueUser = async (prefix: string) => {
		const timestamp = Date.now() + Math.floor(Math.random() * 100000);
		return await UserFactory.merge({
			username: `${prefix}_${timestamp}`,
			email: `${prefix}_${timestamp}@example.com`,
		}).create();
	};

	test('upsert() creates new preferences if none exist', async ({ assert }) => {
		const u = await uniqueUser('upsert_new');
		const result = await repo.upsert(u, { theme: 'dark', locale: 'en' });

		assert.isNotNull(result);
		assert.equal(result.theme, 'dark');
		assert.equal(result.locale, 'en');

		const fetched = await query.execute(u.id);
		assert.isNotNull(fetched);
		assert.equal(fetched!.theme, 'dark');
	});

	test('upsert() updates existing preferences', async ({ assert }) => {
		const u = await uniqueUser('upsert_update');
		await repo.upsert(u, { theme: 'dark', locale: 'en' });

		// Now update only the theme
		const updated = await repo.upsert(u, { theme: 'light' });
		assert.equal(updated.theme, 'light');
		assert.equal(updated.locale, 'en'); // Should be preserved

		// Ensure no new row was created
		const rows = await UserPreference.query().where('userId', u.id);
		assert.lengthOf(rows, 1);
	});
});
