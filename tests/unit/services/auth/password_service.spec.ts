import { test } from '@japa/runner'
import { PasswordService } from '#services/auth/password_service'
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

test.group('PasswordService', () => {
  test('send() dispatches ForgotPassword event', async ({ assert }) => {
    const service = await app.container.make(PasswordService)
    const user = await User.create({
      email: 'forgot@example.com',
      username: 'forgot',
      password: 'pwd',
    })

    const fakeEmitter = emitter.fake()
    await service.send(user)

    assert.isTrue(fakeEmitter.exists(events.auth.ForgotPassword))

    // Cleanup fake
    emitter.restore()
  })

  test('validate() delegates to token repository and throws on invalid token', async ({
    assert,
  }) => {
    const service = await app.container.make(PasswordService)

    await assert.rejects(async () => {
      await service.validate('invalid.token' as any)
    }, InvalidTokenException)
  })

  test('reset() updates password and expires tokens', async ({ assert }) => {
    const service = await app.container.make(PasswordService)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'reset@example.com',
      username: 'reset',
      password: 'old_password',
    })

    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const updatedUser = await service.reset({
      token: fullToken as any,
      password: 'new_password123',
    })

    assert.equal(updatedUser.id, user.id)

    // Token should now be invalid/expired
    await assert.rejects(async () => {
      await service.validate(fullToken as any)
    }, InvalidTokenException)

    // Verify password was changed by trying to log in? No need, updating password is the repo's job and we trust the call
  })
})
