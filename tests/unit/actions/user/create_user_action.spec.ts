import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import emitter from '@adonisjs/core/services/emitter'
import { CreateUserAction } from '#actions/user/create_user_action'
import User from '#models/auth/user'

test.group('CreateUserAction', () => {
  test('execute() creates a new user', async ({ assert }) => {
    // Fake emitter BEFORE making the action to prevent email listener from running
    emitter.fake()

    const action = await app.container.make(CreateUserAction)

    const user = await action.execute({
      email: 'create_user@test.com',
    })

    assert.isNotNull(user.id)
    assert.equal(user.email, 'create_user@test.com')

    emitter.restore()
  })

  test('execute() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
    const action = await app.container.make(CreateUserAction)
    await User.create({
      email: 'exists_create@test.com',
      username: 'exists_create',
      password: 'pwd',
    })

    let threw = false
    try {
      await action.execute({ email: 'exists_create@test.com' })
    } catch (err: any) {
      threw = true
      assert.equal(err.code, 'E_EMAIL_EXISTS')
    }
    assert.isTrue(threw)
  })
})
