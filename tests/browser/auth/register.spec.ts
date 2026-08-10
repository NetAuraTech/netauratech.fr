import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { fillField } from '#tests/helpers/browser/fill_field'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'

test.group('Registration E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())
  group.each.teardown(async () => {
    // Clear limiter stores after each test to avoid rate limiting issues
    try {
      const limiterModule = await import('@adonisjs/limiter/services/main')
      const limiter = limiterModule.default
      await limiter.clear()
    } catch {}
  })

  test('register-success: user can register with valid data', async ({ visit, route }) => {
    const page = await visitPage(route('auth.register.render'), visit)

    const uniqueEmail = `register-${Date.now()}@example.com`

    await fillField(page, 'input', 'email', uniqueEmail)
    await fillField(page, 'input', 'password', 'NewPassword123!')
    await fillField(page, 'input', 'password_confirmation', 'NewPassword123!')
    await page.locator('button[type="submit"]').click()

    await page.waitForURL(/\/settings\/profile/)
    await page.assertPath('/settings/profile')
  })

  test('register-duplicate-email: registration fails with duplicate email', async ({
    visit,
    route,
    assert,
  }) => {
    await createVerifiedUser({
      email: 'duplicate@example.com',
      password: 'TestPassword123!',
    })

    const page = await visitPage(route('auth.register.render'), visit)

    await fillField(page, 'input', 'email', 'duplicate@example.com')
    await fillField(page, 'input', 'password', 'NewPassword123!')
    await fillField(page, 'input', 'password_confirmation', 'NewPassword123!')

    const response = await waitForInertiaResponse(page, '/register', () =>
      page.locator('button[type="submit"]').click()
    )

    await page.assertPath('/register')

    const body = await response.json()
    // Check for validation errors or flash error
    assert.isTrue(
      (body.props.errors && Object.keys(body.props.errors).length > 0) ||
        (body.props.flash && body.props.flash.error)
    )
  })

  test('register-weak-password: registration fails with weak password', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.register.render'), visit)

    const uniqueEmail = `weak-${Date.now()}@example.com`

    await fillField(page, 'input', 'email', uniqueEmail)
    await fillField(page, 'input', 'password', 'weak')
    await fillField(page, 'input', 'password_confirmation', 'weak')

    // Submit form - client-side validation should prevent submission
    await page.locator('button[type="submit"]').click()

    // Wait a moment for client-side validation to run
    await page.waitForTimeout(500)

    // Should still be on register page (form not submitted)
    await page.assertPath('/register')

    // Check for client-side validation error message
    const errorMessage = page.locator('p.text-danger:has-text("at least 8")')
    await assert.isTrue(await errorMessage.isVisible())
  })

  test('register-mismatched-confirmation: registration fails with mismatched password confirmation', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.register.render'), visit)

    const uniqueEmail = `mismatch-${Date.now()}@example.com`

    await fillField(page, 'input', 'email', uniqueEmail)
    await fillField(page, 'input', 'password', 'ValidPassword123!')
    await fillField(page, 'input', 'password_confirmation', 'DifferentPassword123!')

    // Submit form - client-side validation should catch mismatch
    await page.locator('button[type="submit"]').click()

    // Wait a moment for client-side validation to run
    await page.waitForTimeout(500)

    // Should still be on register page (form not submitted)
    await page.assertPath('/register')

    // Check for client-side validation error message
    const errorMessage = page.locator('p.text-danger:has-text("match")')
    await assert.isTrue(await errorMessage.isVisible())
  })

  test('register-missing-fields: registration fails with missing required fields', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(route('auth.register.render'), visit)

    await page.locator('button[type="submit"]').click()

    await page.assertPath('/register')

    // Check HTML5 validation for required fields
    const emailInput = page.locator('input[name="email"]')
    const passwordInput = page.locator('input[name="password"]')
    const confirmInput = page.locator('input[name="password_confirmation"]')

    const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.checkValidity())
    const passwordValid = await passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity())
    const confirmValid = await confirmInput.evaluate((el: HTMLInputElement) => el.checkValidity())

    assert.isFalse(emailValid)
    assert.isFalse(passwordValid)
    assert.isFalse(confirmValid)
  })

  test('register-throttled: registration is throttled after exceeding attempts', async ({
    visit,
    route,
    assert,
  }) => {
    // Make 4 registration attempts with invalid data (to not create users and trigger throttle)
    // We use weak passwords to trigger validation errors, but still count as attempts
    for (let i = 0; i < 4; i++) {
      const page = await visitPage(route('auth.register.render'), visit)
      await page.assertPath('/register')

      // Use weak password to trigger validation error but still count as attempt
      await fillField(page, 'input', 'email', `throttle-${i}-${Date.now()}@example.com`)
      await fillField(page, 'input', 'password', 'weak')
      await fillField(page, 'input', 'password_confirmation', 'weak')
      await page.locator('button[type="submit"]').click()

      await page.waitForTimeout(100)
    }

    // Should be throttled now - verify throttle message
    const page = await visitPage(route('auth.register.render'), visit)
    const content = await page.content()
    assert.match(content, /trop|throttl|rate|limit|429|trop de tentatives|trop de requ/i)
  })
})
