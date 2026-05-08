import { test } from '@japa/runner'
import { EmailVerificationService } from '#services/auth/email_verification_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import emitter from '@adonisjs/core/services/emitter'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { TOKEN_TYPES } from '#types/core'
import { events } from '#generated/events'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('EmailVerificationService', () => {
  test('send() dispatches UserRegistered event', async ({ assert }) => {
    const service = await app.container.make(EmailVerificationService)
    const user = await User.create({
      email: 'verify_send@example.com',
      username: 'verify_send',
      password: 'pwd',
    })

    const fakeEmitter = emitter.fake()
    await service.send(user)

    assert.isTrue(fakeEmitter.exists(events.auth.UserRegistered))

    emitter.restore()
  })

  test('verify() updates user email verified status and expires tokens', async ({ assert }) => {
    const service = await app.container.make(EmailVerificationService)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'verify_me@example.com',
      username: 'verify_me',
      password: 'pwd',
    })

    assert.isFalse(user.isEmailVerified)

    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const verifiedUser = await service.verify(fullToken as any)

    assert.isNotNull(verifiedUser)
    assert.isTrue(verifiedUser!.isEmailVerified)

    // Token should now be invalid/expired
    await assert.rejects(async () => {
      await tokenRepo.getEmailVerificationUser(fullToken as any)
    }, InvalidTokenException)
  })

  test('verify() throws InvalidTokenException on invalid token', async ({ assert }) => {
    const service = await app.container.make(EmailVerificationService)

    await assert.rejects(async () => {
      await service.verify('invalid.token' as any)
    }, InvalidTokenException)
  })
})
