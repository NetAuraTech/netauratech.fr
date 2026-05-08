import { test } from '@japa/runner'
import { InvitationService } from '#services/auth/invitation_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import emitter from '@adonisjs/core/services/emitter'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import { TOKEN_TYPES } from '#types/core'
import { events } from '#generated/events'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'

test.group('InvitationService', () => {
  test('send() creates a user without password and dispatches InviteUser event', async ({
    assert,
  }) => {
    const service = await app.container.make(InvitationService)
    const fakeEmitter = emitter.fake()

    const payload = {
      email: 'invite_me@example.com',
      username: 'invite_me',
      password: 'some_password', // Should be ignored
    }

    const user = await service.send(payload)

    assert.isNotNull(user)
    assert.equal(user.email, 'invite_me@example.com')
    assert.isNull(user.password) // Password should be forced to null

    assert.isTrue(fakeEmitter.exists(events.admin.InviteUser))

    emitter.restore()
  })

  test('send() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
    const service = await app.container.make(InvitationService)
    await User.create({
      email: 'invite_exists@example.com',
      username: 'invite_exists',
      password: 'pwd',
    })

    await assert.rejects(async () => {
      await service.send({ email: 'invite_exists@example.com' })
    }, EmailAlreadyExistsException)
  })

  test('get() returns user associated with the token', async ({ assert }) => {
    const service = await app.container.make(InvitationService)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({ email: 'invite_get@example.com', username: 'invite_get' })
    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.PENDING_INVITE,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const foundUser = await service.get(fullToken as any)
    assert.equal(foundUser.id, user.id)
  })

  test('accept() updates password, sets emailVerifiedAt and expires tokens', async ({ assert }) => {
    const service = await app.container.make(InvitationService)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'invite_accept@example.com',
      username: 'invite_accept',
    })
    assert.isUndefined(user.password)
    assert.isFalse(user.isEmailVerified)

    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.PENDING_INVITE,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const updatedUser = await service.accept(fullToken as any, { password: 'new_password123' })

    assert.equal(updatedUser.id, user.id)
    assert.isNotNull(updatedUser.password)
    assert.isTrue(updatedUser.isEmailVerified)

    // Token should now be expired
    await assert.rejects(async () => {
      await service.get(fullToken as any)
    }, InvalidTokenException)
  })
})
