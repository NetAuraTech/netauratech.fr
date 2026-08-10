import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { AcceptInvitationAction } from '#actions/invitation/accept_invitation_action'
import User from '#models/auth/user'
import hash from '@adonisjs/core/services/hash'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'

test.group('AcceptInvitationAction', () => {
  test('execute() updates password, sets emailVerifiedAt and expires tokens', async ({
    assert,
  }) => {
    const action = await app.container.make(AcceptInvitationAction)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'invite_accept@test.com',
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

    const updatedUser = await action.execute({
      token: fullToken as any,
      password: 'new_password123',
    })

    assert.equal(updatedUser.id, user.id)
    assert.isNotNull(updatedUser.password)
    assert.isTrue(await hash.verify(updatedUser.password!, 'new_password123'))
    assert.isTrue(updatedUser.isEmailVerified)

    await assert.rejects(async () => {
      await tokenRepo.getUserInvitationToken(fullToken as any)
    }, InvalidTokenException)
  })
})
