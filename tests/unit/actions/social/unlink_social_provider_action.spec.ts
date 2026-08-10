import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { UnlinkSocialProviderAction } from '#actions/social/unlink_social_provider_action'
import User from '#models/auth/user'

test.group('UnlinkSocialProviderAction', () => {
  test('execute() removes the provider association', async ({ assert }) => {
    const action = await app.container.make(UnlinkSocialProviderAction)

    const user = await User.create({
      email: 'unlink@test.com',
      username: 'unlink',
      facebookId: 'fb_123_unlink',
    })

    await action.execute({ user, provider: 'facebook' })

    await user.refresh()
    assert.isNull(user.facebookId)
  })
})
