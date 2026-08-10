import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { ConfirmEmailChangeAction } from '#actions/account/confirm_email_change_action'
import User from '#models/auth/user'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('ConfirmEmailChangeAction', () => {
  test('execute() updates email and clears pendingEmail', async ({ assert }) => {
    const action = await app.container.make(ConfirmEmailChangeAction)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'old_confirm@test.com',
      username: 'confirm',
      password: 'pwd',
      pendingEmail: 'new_confirm@test.com',
    })

    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const updated = await action.execute({ token: fullToken as any })

    assert.equal(updated.email, 'new_confirm@test.com')
    assert.isNull(updated.pendingEmail)
    assert.isNotNull(updated.emailVerifiedAt)
  })

  test('execute() throws EmailAlreadyExistsException if pendingEmail taken', async ({ assert }) => {
    const action = await app.container.make(ConfirmEmailChangeAction)
    const tokenRepo = await app.container.make(TokenRepository)

    await User.create({ email: 'taken@test.com', username: 'taken', password: 'pwd' })

    const user = await User.create({
      email: 'old_taken@test.com',
      username: 'old_taken',
      password: 'pwd',
      pendingEmail: 'taken@test.com',
    })

    const { selector, validator, token: fullToken } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await tokenRepo.create({
      userId: user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    await assert.rejects(async () => {
      await action.execute({ token: fullToken as any })
    }, EmailAlreadyExistsException)
  })
})
