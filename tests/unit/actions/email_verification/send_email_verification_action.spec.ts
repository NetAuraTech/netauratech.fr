import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { SendEmailVerificationAction } from '#actions/email_verification/send_email_verification_action'
import User from '#models/auth/user'
import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'

test.group('SendEmailVerificationAction', () => {
  test('execute() dispatches UserRegistered event', async ({ assert }) => {
    const action = await app.container.make(SendEmailVerificationAction)
    const user = await User.create({
      email: 'verify_send@test.com',
      username: 'verify_send',
      password: 'pwd',
    })

    const fakeEmitter = emitter.fake()
    await action.execute({ user })

    assert.isTrue(fakeEmitter.exists(events.auth.UserRegistered))

    emitter.restore()
  })
})
