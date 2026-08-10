import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { VerifyEmailAction } from '#actions/email_verification/verify_email_action'
import User from '#models/auth/user'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('VerifyEmailAction', () => {
  test('execute() updates user email verified status and expires tokens', async ({ assert }) => {
    const action = await app.container.make(VerifyEmailAction)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'verify_me@test.com',
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

    const verifiedUser = await action.execute({ token: fullToken as any })

    assert.isNotNull(verifiedUser)
    assert.isTrue(verifiedUser!.isEmailVerified)

    await assert.rejects(async () => {
      await tokenRepo.getEmailVerificationUser(fullToken as any)
    }, InvalidTokenException)
  })

  test('execute() throws on invalid token', async ({ assert }) => {
    const action = await app.container.make(VerifyEmailAction)

    await assert.rejects(async () => {
      await action.execute({ token: 'invalid.token' as any })
    }, InvalidTokenException)
  })
})
