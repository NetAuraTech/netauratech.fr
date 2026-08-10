import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { LogoutAction } from '#actions/auth/logout_action'

test.group('LogoutAction', () => {
  test('execute() completes without errors', async () => {
    const action = await app.container.make(LogoutAction)
    await action.execute({ userId: 1 })
  })
})
