import { test } from '@japa/runner'
import { TokenRepository } from '#repositories/core/token_repository'
import { LogService } from '#services/logging/log_service'
import { UserFactory } from '#factories/user_factory'
import hash from '@adonisjs/core/services/hash'
import { DateTime } from 'luxon'
import { TOKEN_TYPES, type FullToken } from '#types/core'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import MaxAttemptsExceededException from '#exceptions/core/max_attempts_exceeded_exception'
import type Token from '#models/core/token'

test.group('TokenRepository', () => {
  const logService = new LogService()
  const repo = new TokenRepository(logService)

  const uniqueUser = async (prefix: string) => {
    const timestamp = Date.now() + Math.floor(Math.random() * 100000)
    return await UserFactory.merge({
      username: `${prefix}_${timestamp}`,
      email: `${prefix}_${timestamp}@example.com`,
    }).create()
  }

  const createTestToken = async (
    userId: number,
    type: string,
    expiresInHours = 1
  ): Promise<{ tokenModel: Token; plainToken: FullToken }> => {
    const selector = Math.random().toString(36).substring(2, 10)
    const validator = Math.random().toString(36).substring(2, 10)
    const plainToken = `${selector}.${validator}` as FullToken
    const hashedValidator = await hash.make(validator)

    const tokenModel = await repo.create({
      userId,
      type: type as any,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: expiresInHours }),
    })

    return { tokenModel, plainToken }
  }

  test('create(), findById(), and delete()', async ({ assert }) => {
    const u = await uniqueUser('create')
    const { tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    const found = await repo.findById(tokenModel.id)
    assert.isNotNull(found)

    const deleted = await repo.delete(tokenModel.id)
    assert.isTrue(deleted)

    assert.isNull(await repo.findById(tokenModel.id))
  })

  test('findAll(), findOne(), findMany()', async ({ assert }) => {
    const u = await uniqueUser('find')
    await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION)
    await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION)

    const all = await repo.findAll({ limit: 1 })
    assert.lengthOf(all, 1)

    const one = await repo.findOne({ userId: u.id, type: TOKEN_TYPES.EMAIL_VERIFICATION })
    assert.isNotNull(one)

    const many = await repo.findMany({ userId: u.id }, { limit: 2 })
    assert.isAtLeast(many.length, 2)
  })

  test('update() and count() and exists()', async ({ assert }) => {
    const u = await uniqueUser('update')
    const { tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    const updated = await repo.update(tokenModel.id, { attempts: 5 })
    assert.equal(updated!.attempts, 5)

    assert.isAbove(await repo.count({ userId: u.id }), 0)
    assert.isTrue(await repo.exists({ userId: u.id }))
  })

  test('deleteMany()', async ({ assert }) => {
    const u = await uniqueUser('deleteMany')
    await createTestToken(u.id, 'custom_type')
    await createTestToken(u.id, 'custom_type')

    const deletedCount = await repo.deleteMany({ userId: u.id, type: 'custom_type' })
    assert.equal(deletedCount, 2)
    assert.isFalse(await repo.exists({ userId: u.id, type: 'custom_type' }))
  })

  test('verify() works with valid and invalid tokens', async ({ assert }) => {
    const u = await uniqueUser('verify')
    const { plainToken } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    assert.isTrue(await repo.verify(plainToken, TOKEN_TYPES.PASSWORD_RESET))

    // Wrong type
    assert.isFalse(await repo.verify(plainToken, TOKEN_TYPES.EMAIL_VERIFICATION))

    // Bad validator
    const badValidatorToken = `${plainToken.split('.')[0]}.wrongval` as FullToken
    assert.isFalse(await repo.verify(badValidatorToken, TOKEN_TYPES.PASSWORD_RESET))

    // Bad selector
    assert.isFalse(await repo.verify('wrongsel.val' as FullToken, TOKEN_TYPES.PASSWORD_RESET))

    // Malformed
    assert.isFalse(await repo.verify('malformed_token' as FullToken, TOKEN_TYPES.PASSWORD_RESET))
  })

  test('getUserFromToken() returns the user if valid', async ({ assert }) => {
    const u = await uniqueUser('getuser')
    const { plainToken } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    const resolvedUser = await repo.getUserFromToken(plainToken, TOKEN_TYPES.PASSWORD_RESET)
    assert.isNotNull(resolvedUser)
    assert.equal(resolvedUser!.id, u.id)

    const badUser = await repo.getUserFromToken(
      'bad.token' as FullToken,
      TOKEN_TYPES.PASSWORD_RESET
    )
    assert.isNull(badUser)
  })

  test('incrementAttempts() and checkAttempts()', async ({ assert }) => {
    const u = await uniqueUser('attempts')
    const { plainToken, tokenModel } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    await repo.incrementAttempts(plainToken)
    await repo.incrementAttempts(plainToken)
    await repo.incrementAttempts(plainToken)

    const reloaded = await repo.findById(tokenModel.id)
    assert.equal(reloaded!.attempts, 3)

    await assert.rejects(() => repo.checkAttempts(plainToken, 3), MaxAttemptsExceededException)
    await assert.doesNotReject(() => repo.checkAttempts(plainToken, 4))
  })

  test('expireTokensByType() and convenience helpers', async ({ assert }) => {
    const u = await uniqueUser('expire')
    const { plainToken } = await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION)

    await repo.expireEmailVerificationTokens(u)

    // Verify should fail because it's expired
    assert.isFalse(await repo.verify(plainToken, TOKEN_TYPES.EMAIL_VERIFICATION))

    // Other helpers
    await repo.expirePasswordResetTokens(u)
    await repo.expireEmailChangeTokens(u)
    await repo.expireInviteTokens(u)
  })

  test('High-level GetUser methods throw InvalidTokenException on bad tokens', async ({
    assert,
  }) => {
    await assert.rejects(
      () => repo.getEmailVerificationUser('bad.token' as FullToken),
      InvalidTokenException
    )
    await assert.rejects(
      () => repo.getPasswordResetUser('bad.token' as FullToken),
      InvalidTokenException
    )
    await assert.rejects(
      () => repo.getEmailChangeUser('bad.token' as FullToken),
      InvalidTokenException
    )
    await assert.rejects(
      () => repo.getUserInvitationToken('bad.token' as FullToken),
      InvalidTokenException
    )
  })

  test('High-level GetUser methods return users for valid tokens', async ({ assert }) => {
    const u = await uniqueUser('highlevel')
    u.pendingEmail = 'pending@example.com'
    await u.save()

    const { plainToken: evToken } = await createTestToken(u.id, TOKEN_TYPES.EMAIL_VERIFICATION)
    const { plainToken: prToken } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)
    const { plainToken: ecToken } = await createTestToken(u.id, TOKEN_TYPES.EMAIL_CHANGE)
    const { plainToken: invToken } = await createTestToken(u.id, TOKEN_TYPES.PENDING_INVITE)

    const evUser = await repo.getEmailVerificationUser(evToken)
    assert.equal(evUser.id, u.id)

    const prUser = await repo.getPasswordResetUser(prToken)
    assert.equal(prUser.id, u.id)

    const ecUser = await repo.getEmailChangeUser(ecToken)
    assert.equal(ecUser.id, u.id)

    const inv = await repo.getUserInvitationToken(invToken)
    assert.equal(inv.userId, u.id)
  })

  test('verifyPasswordResetToken() checks both validity and attempts', async ({ assert }) => {
    const u = await uniqueUser('vpwd')
    const { plainToken } = await createTestToken(u.id, TOKEN_TYPES.PASSWORD_RESET)

    // Should pass
    await assert.doesNotReject(() => repo.verifyPasswordResetToken(plainToken))

    // Max attempts
    await repo.update(
      (await repo.findBySelector(plainToken.split('.')[0], TOKEN_TYPES.PASSWORD_RESET))!.id,
      { attempts: 5 }
    )
    await assert.rejects(
      () => repo.verifyPasswordResetToken(plainToken),
      MaxAttemptsExceededException
    )

    // Invalid token
    await assert.rejects(
      () => repo.verifyPasswordResetToken('bad.token' as FullToken),
      InvalidTokenException
    )
  })

  test('deleteInvitationTokens()', async ({ assert }) => {
    const u = await uniqueUser('delinv')
    await createTestToken(u.id, TOKEN_TYPES.PENDING_INVITE)

    await repo.deleteInvitationTokens(u.id)
    assert.isFalse(await repo.exists({ userId: u.id, type: TOKEN_TYPES.PENDING_INVITE }))
  })
})
