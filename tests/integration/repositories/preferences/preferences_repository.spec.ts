import { test } from '@japa/runner'
import PreferencesRepository from '#repositories/preferences/preferences_repository'
import { UserFactory } from '#factories/user_factory'
import { DEFAULT_PREFERENCES } from '#types/preferences'
import UserPreference from '#models/preferences/user_preference'

test.group('PreferencesRepository', () => {
  const repo = new PreferencesRepository()

  const uniqueUser = async (prefix: string) => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000)
    return await UserFactory.merge({
      username: `${prefix}_${timestamp}`,
      email: `${prefix}_${timestamp}@example.com`,
    }).create()
  }

  test('findByUser() returns null when no preferences exist', async ({ assert }) => {
    const u = await uniqueUser('find_null')
    const result = await repo.findByUser(u)
    assert.isNull(result)
  })

  test('upsert() creates new preferences if none exist', async ({ assert }) => {
    const u = await uniqueUser('upsert_new')
    const result = await repo.upsert(u, { theme: 'dark', locale: 'en' })

    assert.isNotNull(result)
    assert.equal(result.theme, 'dark')
    assert.equal(result.locale, 'en')

    const fetched = await repo.findByUser(u)
    assert.isNotNull(fetched)
    assert.equal(fetched!.theme, 'dark')
  })

  test('upsert() updates existing preferences', async ({ assert }) => {
    const u = await uniqueUser('upsert_update')
    await repo.upsert(u, { theme: 'dark', locale: 'en' })

    // Now update only the theme
    const updated = await repo.upsert(u, { theme: 'light' })
    assert.equal(updated.theme, 'light')
    assert.equal(updated.locale, 'en') // Should be preserved

    // Ensure no new row was created
    const rows = await UserPreference.query().where('userId', u.id)
    assert.lengthOf(rows, 1)
  })

  test('getOrCreate() returns existing preferences if they exist', async ({ assert }) => {
    const u = await uniqueUser('getOrCreate_existing')
    await repo.upsert(u, { theme: 'light', locale: 'fr' })

    const result = await repo.getOrCreate(u)
    assert.equal(result.theme, 'light')
    assert.equal(result.locale, 'fr')
  })

  test('getOrCreate() creates defaults if no preferences exist', async ({ assert }) => {
    const u = await uniqueUser('getOrCreate_new')

    const result = await repo.getOrCreate(u)
    assert.equal(result.theme, DEFAULT_PREFERENCES.theme)
    assert.equal(result.locale, DEFAULT_PREFERENCES.locale)

    const rows = await UserPreference.query().where('userId', u.id)
    assert.lengthOf(rows, 1)
  })
})
