import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import emitter from '@adonisjs/core/services/emitter'
import { SendInvitationAction } from '#actions/invitation/send_invitation_action'
import User from '#models/auth/user'

test.group('SendInvitationAction', () => {
  test('execute() creates a pending user', async ({ assert }) => {
    // Fake emitter BEFORE making the action to prevent email listener from running
    emitter.fake()

    const action = await app.container.make(SendInvitationAction)
    const user = await action.execute({ email: 'invite_me@test.com' })

    assert.isNotNull(user.id)
    assert.equal(user.email, 'invite_me@test.com')

    emitter.restore()
  })

  test('execute() throws EmailAlreadyExistsException if email exists', async ({ assert }) => {
    const action = await app.container.make(SendInvitationAction)
    await User.create({
      email: 'invite_exists@test.com',
      username: 'invite_exists',
      password: 'pwd',
    })

    let threw = false
    try {
      await action.execute({ email: 'invite_exists@test.com' })
    } catch (err: any) {
      threw = true
      assert.equal(err.code, 'E_EMAIL_EXISTS')
    }
    assert.isTrue(threw)
  })
})
