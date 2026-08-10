import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ResetPasswordAction } from '#actions/password/reset_password_action'
import User from '#models/auth/user'
import hash from '@adonisjs/core/services/hash'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'

test.group('ResetPasswordAction', () => {
  test('execute() updates password and expires tokens', async ({ assert }) => {
    const action = await app.container.make(ResetPasswordAction)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'reset@test.com',
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

    const updatedUser = await action.execute({
      token: fullToken as any,
      password: 'new_password123',
    })

    assert.equal(updatedUser.id, user.id)
    assert.isTrue(await hash.verify(updatedUser.password!, 'new_password123'))

    await assert.rejects(async () => {
      await tokenRepo.getPasswordResetUser(fullToken as any)
    }, InvalidTokenException)
  })

  test('execute() throws on invalid token', async ({ assert }) => {
    const action = await app.container.make(ResetPasswordAction)

    await assert.rejects(async () => {
      await action.execute({ token: 'invalid.token' as any, password: 'new_password' })
    }, InvalidTokenException)
  })
})
