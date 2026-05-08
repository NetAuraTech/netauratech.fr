import { test } from '@japa/runner'
import PreferencesService from '#services/preferences/preference_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import { DEFAULT_PREFERENCES } from '#types/preferences'

test.group('PreferencesService', () => {
  test('get() returns default preferences for undefined user', async ({ assert }) => {
    const service = await app.container.make(PreferencesService)
    const prefs = await service.get(undefined)
    assert.deepEqual(prefs, DEFAULT_PREFERENCES)
  })

  test('get() returns default preferences for user with no db row', async ({ assert }) => {
    const service = await app.container.make(PreferencesService)
    const user = await User.create({ email: 'pref_user1@example.com', username: 'pref_user1' })
    const prefs = await service.get(user)
    assert.deepEqual(prefs, DEFAULT_PREFERENCES)
  })

  test('update() upserts preferences and returns updated values', async ({ assert }) => {
    const service = await app.container.make(PreferencesService)
    const user = await User.create({ email: 'pref_user2@example.com', username: 'pref_user2' })

    // First update (insert)
    let prefs = await service.update(user, { theme: 'dark' })
    assert.equal(prefs.theme, 'dark')
    assert.equal(prefs.locale, DEFAULT_PREFERENCES.locale) // Default fallback via DB schema if not set

    // Get should now return dark
    const fetched = await service.get(user)
    assert.equal(fetched.theme, 'dark')

    // Second update (update)
    prefs = await service.update(user, { locale: 'fr' })
    assert.equal(prefs.theme, 'dark') // Keeps previous partial state
    assert.equal(prefs.locale, 'fr')
  })
})
