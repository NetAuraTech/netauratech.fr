import { test } from '@japa/runner'
import { SocialService } from '#services/auth/social_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import ProviderAlreadyLinkedException from '#exceptions/auth/provider_already_linked_exception'
import Role from '#models/auth/role'
import { DateTime } from 'luxon'

test.group('SocialService', () => {
  test('findOrCreateUser() returns existing user by provider id', async ({ assert }) => {
    const service = await app.container.make(SocialService)

    const user = await User.create({
      email: 'social1@example.com',
      username: 'social1',
      githubId: 'gh_123',
    })

    const allyUser = { id: 'gh_123' } as any
    const foundUser = await service.findOrCreateUser(allyUser, 'github')

    assert.equal(foundUser.id, user.id)
  })

  test('findOrCreateUser() links provider if email matches and is verified', async ({ assert }) => {
    const service = await app.container.make(SocialService)

    const user = await User.create({
      email: 'social2@example.com',
      username: 'social2',
      emailVerifiedAt: DateTime.now(),
    })
    assert.isUndefined(user.githubId)

    const allyUser = { id: 'gh_456', email: 'social2@example.com' } as any
    const linkedUser = await service.findOrCreateUser(allyUser, 'github')

    assert.equal(linkedUser.id, user.id)
    assert.equal(linkedUser.githubId, 'gh_456')
  })

  test('findOrCreateUser() throws UnverifiedAccountException if email matches but unverified', async ({
    assert,
  }) => {
    const service = await app.container.make(SocialService)

    await User.create({ email: 'social3@example.com', username: 'social3' })

    const allyUser = { id: 'gh_789', email: 'social3@example.com' } as any

    await assert.rejects(async () => {
      await service.findOrCreateUser(allyUser, 'github')
    }, UnverifiedAccountException)
  })

  test('findOrCreateUser() creates new user if no match found', async ({ assert }) => {
    const service = await app.container.make(SocialService)
    await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' })

    const allyUser = {
      id: 'gh_new',
      email: 'new_social@example.com',
      nickName: 'New Social',
    } as any

    const newUser = await service.findOrCreateUser(allyUser, 'github')

    assert.isNotNull(newUser.id)
    assert.equal(newUser.email, 'new_social@example.com')
    assert.equal(newUser.githubId, 'gh_new')
    assert.isNotNull(newUser.emailVerifiedAt)
  })

  test('linkProvider() links provider to authenticated user', async ({ assert }) => {
    const service = await app.container.make(SocialService)

    const user = await User.create({ email: 'link1@example.com', username: 'link1' })
    const allyUser = { id: 'google_123' } as any

    await service.linkProvider(user, allyUser, 'google')

    await user.refresh()
    assert.equal(user.googleId, 'google_123')
  })

  test('linkProvider() throws ProviderAlreadyLinkedException if provider id is linked to another user', async ({
    assert,
  }) => {
    const service = await app.container.make(SocialService)

    // User 1 already linked
    await User.create({ email: 'link2@example.com', username: 'link2', googleId: 'google_456' })

    // User 2 tries to link same provider id
    const user2 = await User.create({ email: 'link3@example.com', username: 'link3' })
    const allyUser = { id: 'google_456' } as any

    await assert.rejects(async () => {
      await service.linkProvider(user2, allyUser, 'google')
    }, ProviderAlreadyLinkedException)
  })

  test('unlinkProvider() removes the provider association', async ({ assert }) => {
    const service = await app.container.make(SocialService)

    const user = await User.create({
      email: 'unlink@example.com',
      username: 'unlink',
      facebookId: 'fb_123',
    })

    await service.unlinkProvider(user, 'facebook')

    await user.refresh()
    assert.isNull(user.facebookId)
  })

  test('needsPasswordSetup() returns true only if user has social accounts and no password', async ({
    assert,
  }) => {
    const service = await app.container.make(SocialService)

    const noPwdNoSocial = new User()
    assert.isFalse(service.needsPasswordSetup(noPwdNoSocial))

    const pwdNoSocial = new User()
    pwdNoSocial.password = 'pwd'
    assert.isFalse(service.needsPasswordSetup(pwdNoSocial))

    const pwdWithSocial = new User()
    pwdWithSocial.password = 'pwd'
    pwdWithSocial.githubId = '123'
    assert.isFalse(service.needsPasswordSetup(pwdWithSocial))

    const noPwdWithSocial = new User()
    noPwdWithSocial.githubId = '123'
    assert.isTrue(service.needsPasswordSetup(noPwdWithSocial))
  })
})
