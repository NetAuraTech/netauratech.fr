import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { UpdateUserAction } from '#actions/user/update_user_action'
import User from '#models/auth/user'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import emitter from '@adonisjs/core/services/emitter'
import { events } from '#generated/events'

test.group('UpdateUserAction', () => {
  test('execute() throws RowNotFoundException if user does not exist', async ({ assert }) => {
    const action = await app.container.make(UpdateUserAction)

    await assert.rejects(async () => {
      await action.execute({ id: 999999, username: 'new' })
    }, RowNotFoundException)
  })

  test('execute() updates user fields', async ({ assert }) => {
    const action = await app.container.make(UpdateUserAction)

    const user = await User.create({
      email: 'update_user@test.com',
      username: 'old_name',
      password: 'pwd',
    })

    const updated = await action.execute({ id: user.id, username: 'new_name' })

    assert.equal(updated.username, 'new_name')
  })

  test('execute() dispatches InitiateEmailChange when email changes', async ({ assert }) => {
    const action = await app.container.make(UpdateUserAction)
    const fakeEmitter = emitter.fake()

    const user = await User.create({
      email: 'update_email@test.com',
      username: 'testuser',
      password: 'pwd',
    })

    await action.execute({ id: user.id, email: 'new_update_email@test.com' })

    assert.isTrue(fakeEmitter.exists(events.account.InitiateEmailChange))
    emitter.restore()
  })
})
