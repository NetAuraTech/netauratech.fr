import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { RegisterUserAction } from '#actions/auth/register_user_action'
import User from '#models/auth/user'
import Role from '#models/auth/role'
import EmailAlreadyExistsException from '#exceptions/account/email_already_exists_exception'
import UserPreference from '#models/preferences/user_preference'

test.group('RegisterUserAction', () => {
  test('execute() creates a new user with preferences', async ({ assert }) => {
    const action = await app.container.make(RegisterUserAction)

    await Role.firstOrCreate({ slug: 'user' }, { slug: 'user', name: 'User Role' })

    const user = await action.execute({
      email: 'register@test.com',
      password: 'password123',
      locale: 'fr',
    })

    assert.isNotNull(user.id)
    assert.equal(user.email, 'register@test.com')

    const prefs = await UserPreference.findBy('userId', user.id)
    assert.isNotNull(prefs)
    assert.equal(prefs?.locale, 'fr')
  })

  test('execute() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
    const action = await app.container.make(RegisterUserAction)

    await User.create({ email: 'exists@test.com', username: 'exists', password: 'pwd' })

    await assert.rejects(async () => {
      await action.execute({
        email: 'exists@test.com',
        password: 'password123',
        locale: 'en',
      })
    }, EmailAlreadyExistsException)
  })
})
