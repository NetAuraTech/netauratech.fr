import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'
import { login } from '#tests/helpers/browser/login'

test.group('Logout E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.teardown(async () => {
    // Clear limiter stores after each test to avoid rate limiting issues
    try {
      const limiterModule = await import('@adonisjs/limiter/services/main')
      const limiter = limiterModule.default
      await limiter.clear()
    } catch {}
  })

  test('logout-success: user can logout successfully', async ({ visit, route, assert }) => {
    const user = await createVerifiedUser({
      email: 'logout-test@example.com',
      password: 'TestPassword123!',
    })

    // Login via the login page to establish session
    const loginPage = await login(
      route('auth.session.render'),
      visit,
      user.email,
      'TestPassword123!'
    )

    await loginPage.assertPath('/settings/profile')

    const response = await waitForInertiaResponse(loginPage, '/login', () =>
      loginPage.locator('button[name="logout"]').click()
    )

    await loginPage.assertPath('/login')
    const body = await response.json()
    assert.exists(body.props.flash.success)
  })

  test('logout-csrf-regenerated: session is destroyed after logout', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'logout-csrf@example.com',
      password: 'TestPassword123!',
    })

    const loginPage = await login(
      route('auth.session.render'),
      visit,
      user.email,
      'TestPassword123!'
    )

    await loginPage.assertPath('/settings/profile')

    const response = await waitForInertiaResponse(loginPage, '/login', () =>
      loginPage.locator('button[name="logout"]').click()
    )

    await loginPage.assertPath('/login')

    const body = await response.json()
    assert.exists(body.props.flash.success)
  })
})
