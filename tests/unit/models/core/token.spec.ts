import { test } from '@japa/runner'
import Token from '#models/core/token'
import User from '#models/auth/user'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { generateSplitToken } from '#helpers/core/crypto'

test.group('Token Model', () => {
  test('expirePasswordResetTokens() expires all reset tokens for a user', async ({ assert }) => {
    const user = await User.create({ email: 'token1@example.com', username: 'token1' })
    const { selector, validator } = generateSplitToken()

    const token = await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await Token.expirePasswordResetTokens(user)

    await token.refresh()
    assert.isTrue(token.expiresAt! <= DateTime.now())
  })

  test('getPasswordResetUser() returns user for valid token', async ({ assert }) => {
    const user = await User.create({ email: 'token2@example.com', username: 'token2' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const foundUser = await Token.getPasswordResetUser(fullToken as any)
    assert.isDefined(foundUser)
    assert.equal(foundUser?.id, user.id)
  })

  test('getPasswordResetUser() returns undefined for invalid validator', async ({ assert }) => {
    const user = await User.create({ email: 'token_inv@example.com', username: 'token_inv' })
    const { selector, validator } = generateSplitToken()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const foundUser = await Token.getPasswordResetUser(`${selector}.invalidvalidator` as any)
    assert.isUndefined(foundUser)
  })

  test('verify() checks if token is valid', async ({ assert }) => {
    const user = await User.create({ email: 'verify_tok@example.com', username: 'verify_tok' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    assert.isTrue(await Token.verify(fullToken as any))
    assert.isFalse(await Token.verify(`${selector}.invalid` as any))
  })

  test('incrementAttempts() and hasExceededAttempts()', async ({ assert }) => {
    const user = await User.create({ email: 'attempts@example.com', username: 'attempts' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    const token = await Token.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
      attempts: 0,
    })

    await Token.incrementAttempts(fullToken as any)
    await token.refresh()
    assert.equal(token.attempts, 1)

    assert.isFalse(await Token.hasExceededAttempts(fullToken as any))

    // Max attempts is 3
    token.attempts = 3
    await token.save()
    assert.isTrue(await Token.hasExceededAttempts(fullToken as any))
  })
})
