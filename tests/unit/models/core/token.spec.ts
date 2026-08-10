import { test } from '@japa/runner'
import { TokenRepository } from '#repositories/core/token_repository'
import { LogService } from '#services/logging/log_service'
import User from '#models/auth/user'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { generateSplitToken } from '#helpers/core/crypto'
import MaxAttemptsExceededException from '#exceptions/core/max_attempts_exceeded_exception'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'

test.group('Token Model — via TokenRepository', () => {
  const repo = new TokenRepository(new LogService())

  test('expirePasswordResetTokens() expires all reset tokens for a user', async ({ assert }) => {
    const user = await User.create({ email: 'token1@example.com', username: 'token1' })
    const { selector, validator } = generateSplitToken()

    const token = await repo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await repo.expirePasswordResetTokens(user)

    const refreshed = await repo.findById(token.id)
    assert.isTrue(refreshed!.expiresAt! <= DateTime.now())
  })

  test('getPasswordResetUser() returns user for valid token', async ({ assert }) => {
    const user = await User.create({ email: 'token2@example.com', username: 'token2' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    await repo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const foundUser = await repo.getPasswordResetUser(fullToken as any)
    assert.isDefined(foundUser)
    assert.equal(foundUser.id, user.id)
  })

  test('getPasswordResetUser() rejects for invalid validator', async ({ assert }) => {
    const user = await User.create({ email: 'token_inv@example.com', username: 'token_inv' })
    const { selector, validator } = generateSplitToken()

    await repo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await assert.rejects(
      () => repo.getPasswordResetUser(`${selector}.invalidvalidator` as any),
      InvalidTokenException
    )
  })

  test('verify() checks if token is valid', async ({ assert }) => {
    const user = await User.create({ email: 'verify_tok@example.com', username: 'verify_tok' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    await repo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    assert.isTrue(await repo.verify(fullToken as any, TOKEN_TYPES.PASSWORD_RESET))
    assert.isFalse(await repo.verify(`${selector}.invalid` as any, TOKEN_TYPES.EMAIL_VERIFICATION))
  })

  test('incrementAttempts() and checkAttempts() with MAX_ATTEMPTS', async ({ assert }) => {
    const user = await User.create({ email: 'attempts@example.com', username: 'attempts' })
    const { selector, validator, token: fullToken } = generateSplitToken()

    await repo.create({
      userId: user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector,
      token: await hash.make(validator),
      expiresAt: DateTime.now().plus({ hours: 1 }),
      attempts: 0,
    })

    await repo.incrementAttempts(fullToken as any)
    const afterFirst = await repo.findById((await repo.findOne({ selector }))!.id)
    assert.equal(afterFirst!.attempts, 1)

    // checkAttempts increments on each call; MAX_ATTEMPTS is 3
    // After 2 more calls attempts = 3, next checkAttempts should throw
    await repo.checkAttempts(fullToken as any) // attempts -> 2
    await repo.checkAttempts(fullToken as any) // attempts -> 3

    await assert.rejects(() => repo.checkAttempts(fullToken as any), MaxAttemptsExceededException)
  })

  test('MAX_ATTEMPTS is unified at 3', async ({ assert }) => {
    assert.equal(repo.MAX_ATTEMPTS, 3)
  })
})
