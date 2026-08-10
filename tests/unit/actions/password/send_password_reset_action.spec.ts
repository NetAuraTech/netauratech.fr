import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { SendPasswordResetAction } from '#actions/password/send_password_reset_action'
import User from '#models/auth/user'
import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'

test.group('SendPasswordResetAction', () => {
  test('execute() dispatches ForgotPassword event', async ({ assert }) => {
    const action = await app.container.make(SendPasswordResetAction)
    const user = await User.create({
      email: 'forgot@test.com',
      username: 'forgot',
      password: 'pwd',
    })

    const fakeEmitter = emitter.fake()
    await action.execute({ user })

    assert.isTrue(fakeEmitter.exists(events.auth.ForgotPassword))

    emitter.restore()
  })
})
