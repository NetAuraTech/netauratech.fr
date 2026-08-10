import { test } from '@japa/runner'
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  acceptInvitationValidator,
} from '#validators/auth'
import User from '#models/auth/user'

test.group('Auth Validators', () => {
  test('registerValidator requires valid email and confirmed password', async ({ assert }) => {
    const valid = {
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    }

    const result = await registerValidator.validate(valid)
    assert.equal(result.email, 'test@example.com')
    assert.equal(result.password, 'password123')

    // Missing confirmation
    await assert.rejects(() =>
      registerValidator.validate({
        email: 'test2@example.com',
        password: 'password123',
      })
    )

    // Invalid email
    await assert.rejects(() =>
      registerValidator.validate({
        email: 'invalid-email',
        password: 'password123',
        password_confirmation: 'password123',
      })
    )
  })

  test('registerValidator rejects duplicate email', async ({ assert }) => {
    await User.create({
      email: 'auth_taken@example.com',
      password: 'password',
      username: 'auth_taken',
    })

    await assert.rejects(() =>
      registerValidator.validate({
        email: 'auth_taken@example.com',
        password: 'password123',
        password_confirmation: 'password123',
      })
    )
  })

  test('loginValidator requires email and password', async ({ assert }) => {
    const valid = {
      email: 'test@example.com',
      password: 'password123',
      remember_me: true,
    }

    const result = await loginValidator.validate(valid)
    assert.equal(result.email, 'test@example.com')
    assert.isTrue(result.remember_me)
  })

  test('acceptInvitationValidator rejects duplicate username or email except for same user', async ({
    assert,
  }) => {
    const user1 = await User.create({
      email: 'auth_user1@example.com',
      username: 'auth_user1',
      password: 'pwd',
    })
    await User.create({
      email: 'auth_user2@example.com',
      username: 'auth_user2',
      password: 'pwd',
    })

    const validator = acceptInvitationValidator(user1.id)

    // Should reject because user2's email is taken by user2
    await assert.rejects(() =>
      validator.validate({
        email: 'auth_user2@example.com',
        username: 'auth_new_username',
        password: 'password123',
        password_confirmation: 'password123',
      })
    )

    // Should accept user1's own email
    const result = await validator.validate({
      email: 'auth_user1@example.com',
      username: 'auth_user1_new',
      password: 'password123',
      password_confirmation: 'password123',
    })

    assert.equal(result.email, 'auth_user1@example.com')
    assert.equal(result.username, 'auth_user1_new')
  })

  test('forgotPasswordValidator requires valid email', async ({ assert }) => {
    await assert.rejects(() => forgotPasswordValidator.validate({ email: 'invalid' }))
    const res = await forgotPasswordValidator.validate({ email: 'valid@example.com' })
    assert.equal(res.email, 'valid@example.com')
  })

  test('resetPasswordValidator requires token and confirmed password', async ({ assert }) => {
    const valid = {
      token: 'some-token',
      password: 'new-password123',
      password_confirmation: 'new-password123',
    }
    const res = await resetPasswordValidator.validate(valid)
    assert.equal(res.token, 'some-token')
  })
})
