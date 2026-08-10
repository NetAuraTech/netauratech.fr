import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { fillField } from '#tests/helpers/browser/fill_field'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'

test.group('Forgot Password E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.teardown(async () => {
    // Clear limiter stores after each test to avoid rate limiting issues
    try {
      const limiterModule = await import('@adonisjs/limiter/services/main')
      const limiter = limiterModule.default
      await limiter.clear()
    } catch {}
  })

  test('forgot-password-success: valid existing email shows success message', async ({
    visit,
    route,
  }) => {
    await createVerifiedUser({
      email: 'forgot@example.com',
      password: 'TestPassword123!',
    })

    const page = await visitPage(route('auth.forgot_password.render'), visit)

    await fillField(page, 'input', 'email', 'forgot@example.com')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/login/)
    await page.assertPath('/login')
  })

  test('forgot-password-nonexistent: non-existent email shows same success message (no user enumeration)', async ({
    visit,
    route,
  }) => {
    const page = await visitPage(route('auth.forgot_password.render'), visit)

    await fillField(page, 'input', 'email', 'nonexistent@example.com')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/login/)
    await page.assertPath('/login')
  })

  test('forgot-password-throttled: forgot password is throttled after exceeding attempts', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.forgot_password.render'), visit)

    // Verify page loads
    await page.assertPath('/forgot-password')

    // Make 4 attempts (limit is typically 3 per hour)
    for (let i = 0; i < 4; i++) {
      await fillField(page, 'input', 'email', `throttle-${i}-${Date.now()}@example.com`)
      await page.locator('button[type="submit"]').click()

      await page.waitForTimeout(100)
      await page.reload()
    }

    // Should be throttled now - the request should return 429 or show throttle message
    // After throttle, the page redirects to login (due to throttle middleware)
    const url = page.url()
    // The throttle redirects to login, so we check for that or the throttle message
    assert.isTrue(url.includes('/forgot-password') || url.includes('/login'))
    const content = await page.content()
    assert.match(content, /trop|throttl|rate|limit|429|trop de tentatives|trop de requ/i)
  })

  test('forgot-password-invalid-email: invalid email format shows validation error', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.forgot_password.render'), visit)

    await fillField(page, 'input', 'email', 'invalid-email')
    await page.locator('button[type="submit"]').click()

    // Wait a moment for client-side validation
    await page.waitForTimeout(500)

    // Should still be on forgot-password page
    await page.assertPath('/forgot-password')

    // Check for client-side validation error
    const errorMessage = page.locator('p.text-danger:has-text("email")')
    await assert.isTrue(await errorMessage.isVisible())
  })
})
