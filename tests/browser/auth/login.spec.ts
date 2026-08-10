import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { fillField } from '#tests/helpers/browser/fill_field'
import { fieldIsFilled } from '#tests/helpers/browser/field_is_filled'
import { login } from '#tests/helpers/browser/login'

test.group('Login E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.teardown(async () => {
    // Clear limiter stores after each test to avoid rate limiting issues
    try {
      const limiterModule = await import('@adonisjs/limiter/services/main')
      const limiter = limiterModule.default
      await limiter.clear()
    } catch {}
  })

  test('login-success: user can login with valid credentials', async ({ visit, route }) => {
    const user = await createVerifiedUser({
      email: 'login-success@example.com',
      password: 'TestPassword123!',
    })

    const page = await login(route('auth.session.render'), visit, user.email, 'TestPassword123!')

    await page.assertPath('/settings/profile')
    await page.assertTextContains('body', 'Profil')
  })

  test('login-invalid-email: login fails with non-existent email', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.session.render'), visit)

    await fillField(page, 'input', 'email', 'nonexistent@example.com')
    await fillField(page, 'input', 'password', 'wrongpassword')

    const response = await waitForInertiaResponse(page, '/login', () =>
      page.locator('button[type="submit"]').click()
    )

    await page.assertPath('/login')

    const body = await response.json()
    assert.exists(body.props.flash.error)
  })

  test('login-invalid-password: login fails with wrong password', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'wrong-password@example.com',
      password: 'CorrectPassword123!',
    })

    const page = await visitPage(route('auth.session.render'), visit)

    await fillField(page, 'input', 'email', user.email)
    await fillField(page, 'input', 'password', 'WrongPassword123!')

    const response = await waitForInertiaResponse(page, '/login', () =>
      page.locator('button[type="submit"]').click()
    )

    await page.assertPath('/login')

    const body = await response.json()
    assert.exists(body.props.flash.error)
  })

  test('login-missing-email: login fails with missing email field', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.session.render'), visit)

    const { isValid, isValueMissing } = await fieldIsFilled(page, 'input', 'email')

    await fillField(page, 'input', 'password', 'anypassword')
    await page.locator('button[type="submit"]').click()

    await page.assertPath('/login')
    assert.isFalse(isValid)
    assert.isTrue(isValueMissing)
  })

  test('login-missing-password: login fails with missing password field', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.session.render'), visit)

    const { isValid, isValueMissing } = await fieldIsFilled(page, 'input', 'password')

    await fillField(page, 'input', 'email', 'test@example.com')
    await page.locator('button[type="submit"]').click()

    await page.assertPath('/login')
    assert.isFalse(isValid)
    assert.isTrue(isValueMissing)
  })

  test('login-throttled: login is throttled after exceeding attempts', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.session.render'), visit)

    // Make 6 failed attempts (limit is typically 5 per 15 minutes)
    for (let i = 0; i < 6; i++) {
      await fillField(page, 'input', 'email', `throttle${i}@example.com`)
      await fillField(page, 'input', 'password', 'wrongpassword')
      await page.locator('button[type="submit"]').click()

      await page.waitForTimeout(100) // Small delay between attempts
      await page.reload()
    }

    await page.assertPath('/login')
    // Check for throttled response - page content should contain throttle message
    const content = await page.content()
    assert.match(content, /trop|throttl|rate|limit|429|trop de tentatives|trop de requ/i)
  })

  test('login-already-authenticated: authenticated user redirected from login page', async ({
    visit,
    route,
  }) => {
    const user = await createVerifiedUser({
      email: 'already-auth@example.com',
      password: 'TestPassword123!',
    })

    // Login first
    const loggedInPage = await login(
      route('auth.session.render'),
      visit,
      user.email,
      'TestPassword123!'
    )
    await loggedInPage.assertPath('/settings/profile')

    // Visit login page again - guest middleware redirects authenticated users to /
    const page = await visitPage(route('auth.session.render'), visit)

    await page.waitForTimeout(500)
    await page.assertPath('/')
  })

  test('login-remember-me: remember me checkbox creates persistent session', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'remember-me@example.com',
      password: 'TestPassword123!',
    })

    const page = await visitPage(route('auth.session.render'), visit)

    // Fill credentials
    await fillField(page, 'input', 'email', user.email)
    await fillField(page, 'input', 'password', 'TestPassword123!')

    // Check the remember me checkbox
    await page.locator('input[name="remember_me"]').check()

    // Submit and wait for redirect
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(/\/settings\/profile/)
    await page.assertPath('/settings/profile')

    // Verify the session cookie exists (remember me sets long-lived cookie)
    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name === 'adonis-session')
    assert.exists(sessionCookie)
    // Remember me cookie should have an expiration (not session cookie)
    if (sessionCookie) {
      // Just verify it has an expiration (not -1 which means session cookie)
      assert.isTrue(sessionCookie.expires > 0, 'Remember me cookie should have expiration')
    }
  })
})
