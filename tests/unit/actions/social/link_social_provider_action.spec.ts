import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { LinkSocialProviderAction } from '#actions/social/link_social_provider_action'
import User from '#models/auth/user'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import ProviderAlreadyLinkedException from '#exceptions/auth/provider_already_linked_exception'
import { DateTime } from 'luxon'

test.group('LinkSocialProviderAction', () => {
  test('execute() throws UnverifiedAccountException if email not verified', async ({ assert }) => {
    const action = await app.container.make(LinkSocialProviderAction)

    const user = await User.create({
      email: 'link_unverified@test.com',
      username: 'link_unverified',
    })

    await assert.rejects(async () => {
      await action.execute({ user, allyUser: { id: 'google_123' }, provider: 'google' })
    }, UnverifiedAccountException)
  })

  test('execute() links provider to authenticated user', async ({ assert }) => {
    const action = await app.container.make(LinkSocialProviderAction)

    const user = await User.create({
      email: 'link1@test.com',
      username: 'link1',
      emailVerifiedAt: DateTime.now(),
    })
    const allyUser = { id: 'google_link_123' } as any

    await action.execute({ user, allyUser, provider: 'google' })

    await user.refresh()
    assert.equal(user.googleId, 'google_link_123')
  })

  test('execute() throws ProviderAlreadyLinkedException if provider linked to another user', async ({
    assert,
  }) => {
    const action = await app.container.make(LinkSocialProviderAction)

    await User.create({
      email: 'link2@test.com',
      username: 'link2',
      googleId: 'google_conflict_456',
    })

    const user2 = await User.create({
      email: 'link3@test.com',
      username: 'link3',
      emailVerifiedAt: DateTime.now(),
    })
    const allyUser = { id: 'google_conflict_456' } as any

    await assert.rejects(async () => {
      await action.execute({ user: user2, allyUser, provider: 'google' })
    }, ProviderAlreadyLinkedException)
  })
})
