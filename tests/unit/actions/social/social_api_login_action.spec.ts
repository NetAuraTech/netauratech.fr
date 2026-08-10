import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { Secret } from '@adonisjs/core/helpers'
import { SocialApiLoginAction } from '#actions/social/social_api_login_action'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import { DateTime } from 'luxon'

test.group('SocialApiLoginAction', () => {
  test('execute() issues an API token for an existing provider user', async ({ assert }) => {
    const action = await app.container.make(SocialApiLoginAction)

    const user = await User.create({
      email: 'api-social1@test.com',
      username: 'api-social1',
      githubId: 'gh_api_123',
    })

    const result = await action.execute({
      provider: 'github',
      allyUser: { id: 'gh_api_123' } as any,
    })

    assert.equal(result.user.id, user.id)
    assert.isString(result.token)
    assert.isNotEmpty(result.token)
    assert.isNotNull(result.expiresAt)

    const token = await User.accessTokens.verify(new Secret(result.token))
    assert.equal(token?.tokenableId, user.id)
  })

  test('execute() creates a new user and issues a token when no match exists', async ({
    assert,
  }) => {
    const action = await app.container.make(SocialApiLoginAction)
    await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' })

    const result = await action.execute({
      provider: 'google',
      allyUser: {
        id: 'google_api_new',
        email: 'new_api_social@test.com',
        nickName: 'New Api Social',
      } as any,
    })

    assert.isNotNull(result.user.id)
    assert.equal(result.user.googleId, 'google_api_new')
    assert.equal(result.user.email, 'new_api_social@test.com')
    assert.isString(result.token)
    assert.isNotEmpty(result.token)
  })

  test('execute() throws UnverifiedAccountException when email matches an unverified account', async ({
    assert,
  }) => {
    const action = await app.container.make(SocialApiLoginAction)

    await User.create({ email: 'api_social3@test.com', username: 'api-social3' })

    await assert.rejects(async () => {
      await action.execute({
        provider: 'github',
        allyUser: { id: 'gh_api_456', email: 'api_social3@test.com' } as any,
      })
    }, UnverifiedAccountException)
  })

  test('execute() resolves an email-matched verified account and links it', async ({ assert }) => {
    const action = await app.container.make(SocialApiLoginAction)

    const user = await User.create({
      email: 'api_social4@test.com',
      username: 'api-social4',
      emailVerifiedAt: DateTime.now(),
    })

    const result = await action.execute({
      provider: 'github',
      allyUser: { id: 'gh_api_789', email: 'api_social4@test.com' } as any,
    })

    assert.equal(result.user.id, user.id)
    await user.refresh()
    assert.equal(user.githubId, 'gh_api_789')
  })
})
