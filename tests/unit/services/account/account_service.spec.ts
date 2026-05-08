import { test } from '@japa/runner'
import { AccountService } from '#services/account/account_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import hash from '@adonisjs/core/services/hash'
import UnverifiedAccountException from '#exceptions/auth/unverified_account_exception'
import InvalidCurrentPasswordException from '#exceptions/auth/invalid_current_password_exception'
import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'
import { generateSplitToken } from '#helpers/core/crypto'
import { TokenRepository } from '#repositories/core/token_repository'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'

test.group('AccountService', () => {
  test('update() throws UnverifiedAccountException if email is not verified', async ({
    assert,
  }) => {
    const service = await app.container.make(AccountService)
    const user = await User.create({
      email: 'unverified_acct@example.com',
      username: 'unverified_acct',
      password: 'pwd',
    })

    await assert.rejects(async () => {
      await service.update(user, { email: 'new@example.com' })
    }, UnverifiedAccountException)
  })

  test('update() throws InvalidCurrentPasswordException if current_password is wrong', async ({
    assert,
  }) => {
    const service = await app.container.make(AccountService)
    const user = await User.create({
      email: 'wrongpwd_acct@example.com',
      username: 'wrongpwd_acct',
      password: 'correct_password',
      emailVerifiedAt: DateTime.now(),
    })

    await assert.rejects(async () => {
      await service.update(user, { current_password: 'wrong_password', password: 'new_password' })
    }, InvalidCurrentPasswordException)
  })

  test('update() changes password if current_password is correct', async ({ assert }) => {
    const service = await app.container.make(AccountService)
    const user = await User.create({
      email: 'changepwd@example.com',
      username: 'changepwd',
      password: 'old_password',
      emailVerifiedAt: DateTime.now(),
    })

    const updated = await service.update(user, {
      current_password: 'old_password',
      password: 'new_password123',
    })

    assert.isTrue(await hash.verify(updated.password!, 'new_password123'))
  })

  test('update() sets pendingEmail and dispatches InitiateEmailChange when email changes', async ({
    assert,
  }) => {
    const service = await app.container.make(AccountService)
    const fakeEmitter = emitter.fake()

    const user = await User.create({
      email: 'changeemail@example.com',
      username: 'changeemail',
      password: 'pwd',
      emailVerifiedAt: DateTime.now(),
    })

    const updated = await service.update(user, { email: 'new_email@example.com' })

    assert.equal(updated.email, 'changeemail@example.com')
    assert.equal(updated.pendingEmail, 'new_email@example.com')

    assert.isTrue(fakeEmitter.exists(events.account.InitiateEmailChange))

    emitter.restore()
  })

  test('confirmEmailChange() updates email and clears pendingEmail', async ({ assert }) => {
    const service = await app.container.make(AccountService)
    const tokenRepo = await app.container.make(TokenRepository)

    const user = await User.create({
      email: 'old_confirm@example.com',
      username: 'confirm',
      password: 'pwd',
      pendingEmail: 'new_confirm@example.com',
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

    const updated = await service.confirmEmailChange(fullToken as any)

    assert.equal(updated.email, 'new_confirm@example.com')
    assert.isNull(updated.pendingEmail)
    assert.isNotNull(updated.emailVerifiedAt)
  })

  test('confirmEmailChange() throws EmailAlreadyExistsException if pendingEmail is taken', async ({
    assert,
  }) => {
    const service = await app.container.make(AccountService)
    const tokenRepo = await app.container.make(TokenRepository)

    // Someone else took the email in the meantime
    await User.create({ email: 'taken@example.com', username: 'taken', password: 'pwd' })

    const user = await User.create({
      email: 'old_taken@example.com',
      username: 'old_taken',
      password: 'pwd',
      pendingEmail: 'taken@example.com',
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
      await service.confirmEmailChange(fullToken as any)
    }, EmailAlreadyExistsException)
  })

  test('delete() deletes the user account if password is correct', async ({ assert }) => {
    const service = await app.container.make(AccountService)

    const user = await User.create({
      email: 'delete_acct@example.com',
      username: 'delete_acct',
      password: 'password123',
    })

    await service.delete(user, { password: 'password123' })

    const found = await User.find(user.id)
    assert.isNull(found)
  })

  test('delete() throws InvalidCurrentPasswordException if password is wrong', async ({
    assert,
  }) => {
    const service = await app.container.make(AccountService)

    const user = await User.create({
      email: 'delete_wrong@example.com',
      username: 'delete_wrong',
      password: 'password123',
    })

    await assert.rejects(async () => {
      await service.delete(user, { password: 'wrong_password' })
    }, InvalidCurrentPasswordException)
  })
})
