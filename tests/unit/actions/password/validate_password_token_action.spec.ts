import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ValidatePasswordTokenAction } from '#actions/password/validate_password_token_action'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'

test.group('ValidatePasswordTokenAction', () => {
  test('execute() throws on invalid token', async ({ assert }) => {
    const action = await app.container.make(ValidatePasswordTokenAction)

    await assert.rejects(async () => {
      await action.execute({ token: 'invalid.token' as any })
    }, InvalidTokenException)
  })
})
