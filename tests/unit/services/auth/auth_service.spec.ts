import { test } from '@japa/runner'
import { AuthService } from '#services/auth/auth_service'
import app from '@adonisjs/core/services/app'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import InvalidCredentialsException from '#exceptions/auth/invalid_credentials_exception'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import UserPreference from '#models/preferences/user_preference'

test.group('AuthService', () => {
  test('register() creates a new user and preferences', async ({ assert }) => {
    const service = await app.container.make(AuthService)

    // Ensure default role exists
    await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' })

    const user = await service.register({
      email: 'test_register@example.com',
      password: 'password123',
      locale: 'fr',
    })

    assert.isNotNull(user.id)
    assert.equal(user.email, 'test_register@example.com')
    assert.equal(user.username, 'Test Register')

    // Verify preferences were created
    const prefs = await UserPreference.findBy('userId', user.id)
    assert.isNotNull(prefs)
    assert.equal(prefs?.locale, 'fr')
  })

  test('register() throws if email already exists', async ({ assert }) => {
    const service = await app.container.make(AuthService)

    await User.create({ email: 'exists@example.com', username: 'exists', password: 'pwd' })

    await assert.rejects(async () => {
      await service.register({
        email: 'exists@example.com',
        password: 'password123',
        locale: 'en',
      })
    }, EmailAlreadyExistsException)
  })

  test('login() returns user on valid credentials', async ({ assert }) => {
    const service = await app.container.make(AuthService)

    await User.create({ email: 'login@example.com', username: 'login', password: 'password123' })

    const user = await service.login('login@example.com', 'password123')
    assert.isNotNull(user)
    assert.equal(user.email, 'login@example.com')
  })

  test('login() throws InvalidCredentialsException on wrong password', async ({ assert }) => {
    const service = await app.container.make(AuthService)

    await User.create({
      email: 'wrongpwd@example.com',
      username: 'wrongpwd',
      password: 'password123',
    })

    await assert.rejects(async () => {
      await service.login('wrongpwd@example.com', 'wrongpassword')
    }, InvalidCredentialsException)
  })

  test('login() throws InvalidCredentialsException on wrong email', async ({ assert }) => {
    const service = await app.container.make(AuthService)

    await assert.rejects(async () => {
      await service.login('nonexistent@example.com', 'password123')
    }, InvalidCredentialsException)
  })

  test('logout() executes without errors', async () => {
    const service = await app.container.make(AuthService)

    // We only verify it doesn't crash since it just calls LogService
    await service.logout(1)
  })
})
