import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { UpdateUserProfileAction } from '#actions/profile/update_user_profile_action'
import User from '#models/auth/user'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import { DateTime } from 'luxon'

test.group('UpdateUserProfileAction', () => {
  test('execute() throws UnverifiedAccountException if email not verified', async ({ assert }) => {
    const action = await app.container.make(UpdateUserProfileAction)

    const user = await User.create({
      email: 'profile_unverified@test.com',
      username: 'profile_unverif',
    })
    assert.isFalse(user.isEmailVerified)

    await assert.rejects(async () => {
      await action.execute({ user, username: 'new_username' })
    }, UnverifiedAccountException)
  })

  test('execute() updates the user profile and returns updated user', async ({ assert }) => {
    const action = await app.container.make(UpdateUserProfileAction)

    const user = await User.create({
      email: 'profile_verified@test.com',
      username: 'old_username',
      emailVerifiedAt: DateTime.now(),
    })
    assert.isTrue(user.isEmailVerified)

    const updated = await action.execute({ user, username: 'new_username' })

    assert.equal(updated.id, user.id)
    assert.equal(updated.username, 'new_username')
  })
})
