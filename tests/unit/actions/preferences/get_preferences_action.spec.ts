import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import User from '#models/auth/user'
import { DEFAULT_PREFERENCES } from '#types/preferences'

test.group('GetPreferencesAction', () => {
  test('execute() returns default preferences for undefined user', async ({ assert }) => {
    const action = await app.container.make(GetPreferencesAction)
    const prefs = await action.execute({ user: undefined })
    assert.deepEqual(prefs, DEFAULT_PREFERENCES)
  })

  test('execute() returns default preferences for user with no db row', async ({ assert }) => {
    const action = await app.container.make(GetPreferencesAction)
    const user = await User.create({ email: 'pref_user_get@test.com', username: 'pref_user_get' })
    const prefs = await action.execute({ user })
    assert.deepEqual(prefs, DEFAULT_PREFERENCES)
  })
})
