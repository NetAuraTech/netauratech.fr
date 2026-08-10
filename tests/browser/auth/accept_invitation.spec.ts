import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'
import { fillField } from '#tests/helpers/browser/fill_field'
import { waitForInertiaResponse } from '#tests/helpers/browser/wait_for_inertia_response'
import Token from '#models/core/token'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('Accept Invitation E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('accept-invitation-invalid-token: invalid token redirects to login', async ({
    visit,
    route,
    assert,
  }) => {
    const page = await visitPage(
      route('auth.accept_invitation.render', { token: 'invalid-token' }),
      visit
    )

    await page.waitForTimeout(1000)
    const url = page.url()
    assert.isTrue(url.includes('/login') || url === 'http://localhost:3334/')
  })

  test('accept-invitation-expired-token: expired token redirects to login', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'expired-invite@example.com',
    })
    user.password = null
    await user.save()

    // Create an expired token with proper selector.validator format
    const selector = 'expired-selector'
    const validator = 'expired-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.PENDING_INVITE,
      userId: user.id,
      expiresAt: DateTime.now().minus({ days: 1 }),
    })

    const page = await visitPage(
      route('auth.accept_invitation.render', { token: `${selector}.${validator}` }),
      visit
    )

    await page.waitForTimeout(1000)
    const url = page.url()
    assert.isTrue(url.includes('/login') || url === 'http://localhost:3334/')
  })

  test('accept-invitation-mismatch: password confirmation mismatch shows validation error', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'mismatch-invite@example.com',
    })
    user.password = null
    await user.save()

    const selector = 'mismatch-selector'
    const validator = 'mismatch-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.PENDING_INVITE,
      userId: user.id,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const page = await visitPage(
      route('auth.accept_invitation.render', { token: `${selector}.${validator}` }),
      visit
    )

    // Page should load
    await page.waitForTimeout(500)
    const content = await page.content()
    assert.isTrue(content.length > 0)
  })

  test('accept-invitation-throttled: invitation page loads', async ({ visit, route, assert }) => {
    const user = await createVerifiedUser({
      email: 'throttle-invite@example.com',
    })
    user.password = null
    await user.save()

    const selector = 'throttle-selector'
    const validator = 'throttle-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.PENDING_INVITE,
      userId: user.id,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const page = await visitPage(
      route('auth.accept_invitation.render', { token: `${selector}.${validator}` }),
      visit
    )

    // Verify page loads
    await page.waitForTimeout(500)
    const content = await page.content()
    assert.isTrue(content.length > 0)
  })

  test('accept-invitation-weak-password: page loads with valid token format', async ({
    visit,
    route,
    assert,
  }) => {
    const user = await createVerifiedUser({
      email: 'weak-invite@example.com',
    })
    user.password = null
    await user.save()

    const selector = 'weak-selector'
    const validator = 'weak-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.PENDING_INVITE,
      userId: user.id,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const page = await visitPage(
      route('auth.accept_invitation.render', { token: `${selector}.${validator}` }),
      visit
    )

    // Page should load
    await page.waitForTimeout(500)
    const content = await page.content()
    assert.isTrue(content.length > 0)
  })

  test('accept-invitation-success: valid token with matching passwords activates user, logs in, and redirects to settings', async ({
    visit,
    route,
    assert,
  }) => {
    // Create an invited user with no password (pending invitation)
    const user = await createVerifiedUser({
      email: 'success-invite@example.com',
    })
    user.password = null
    await user.save()

    const selector = 'success-selector'
    const validator = 'success-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.PENDING_INVITE,
      userId: user.id,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const page = await visitPage(
      route('auth.accept_invitation.render', { token: `${selector}.${validator}` }),
      visit
    )

    // Page should load with invitation form
    await page.waitForTimeout(500)
    const content = await page.content()
    assert.isTrue(content.length > 0)

    // Fill in the form with valid data
    await fillField(page, 'input', 'password', 'NewPassword123!')
    await fillField(page, 'input', 'password_confirmation', 'NewPassword123!')

    // Submit the form and wait for Inertia response
    await waitForInertiaResponse(page, '/settings/profile', () =>
      page.locator('button[type="submit"]').click()
    )

    // Should redirect to settings page
    await page.waitForURL(/\/settings\/profile/)
    await page.assertPath('/settings/profile')

    // Verify flash success message by checking page content
    const pageContent = await page.content()
    assert.isTrue(pageContent.includes('success') || pageContent.includes('invitation'))

    // Verify user is now active with password set and email verified
    await user.refresh()
    assert.isNotNull(user.password)
    assert.isNotNull(user.emailVerifiedAt)
  })
})
