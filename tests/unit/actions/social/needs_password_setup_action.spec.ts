import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import { NeedsPasswordSetupAction } from '#actions/social/needs_password_setup_action'
import User from '#models/auth/user'

test.group('NeedsPasswordSetupAction', () => {
  test('execute() returns true only if user has social accounts and no password', async ({
    assert,
  }) => {
    const action = await app.container.make(NeedsPasswordSetupAction)

    const noPwdNoSocial = new User()
    assert.isFalse(await action.execute({ user: noPwdNoSocial }))

    const pwdNoSocial = new User()
    pwdNoSocial.password = 'pwd'
    assert.isFalse(await action.execute({ user: pwdNoSocial }))

    const pwdWithSocial = new User()
    pwdWithSocial.password = 'pwd'
    pwdWithSocial.githubId = '123'
    assert.isFalse(await action.execute({ user: pwdWithSocial }))

    const noPwdWithSocial = new User()
    noPwdWithSocial.githubId = '123'
    assert.isTrue(await action.execute({ user: noPwdWithSocial }))
  })
})
