import { test } from '@japa/runner'
import { ProfileService } from '#services/profile/profile_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import { DateTime } from 'luxon'

test.group('ProfileService', () => {
  test('update() throws UnverifiedAccountException if email is not verified', async ({
    assert,
  }) => {
    const service = await app.container.make(ProfileService)

    const user = await User.create({
      email: 'profile_unverified@example.com',
      username: 'profile_unverif',
    })
    assert.isFalse(user.isEmailVerified)

    await assert.rejects(async () => {
      await service.update(user, { username: 'new_username' })
    }, UnverifiedAccountException)
  })

  test('update() updates the user profile and returns updated user', async ({ assert }) => {
    const service = await app.container.make(ProfileService)

    const user = await User.create({
      email: 'profile_verified@example.com',
      username: 'old_username',
      emailVerifiedAt: DateTime.now(),
    })
    assert.isTrue(user.isEmailVerified)

    const updated = await service.update(user, { username: 'new_username' })

    assert.equal(updated.id, user.id)
    assert.equal(updated.username, 'new_username')
  })
})
