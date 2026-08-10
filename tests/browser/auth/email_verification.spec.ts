import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { visitPage } from '#tests/helpers/browser/visit_page'
import { createVerifiedUser } from '#tests/helpers/browser/create_verified_user'
import User from '#models/auth/user'
import Token from '#models/core/token'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'

test.group('Email Verification E2E', (group) => {
  group.each.setup(() => testUtils.db().truncate())

  test('verify-email-success: valid token verifies email and logs in user', async ({
    visit,
    route,
    assert,
  }) => {
    // Create an UNVERIFIED user (emailVerifiedAt: null)
    const user = await User.create({
      email: 'verify-success@example.com',
      password: 'Password123!',
      username: 'verify-success',
      emailVerifiedAt: null,
    })

    // Create email verification token with proper selector.validator format
    const selector = 'verify-selector'
    const validator = 'verify-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      userId: user.id,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    // Verify email with valid token
    const page = await visitPage(
      route('auth.email_verification.execute', { token: `${selector}.${validator}` }),
      visit
    )

    // The email verification redirects to settings/profile
    await page.waitForURL(/\/settings\/profile/, { timeout: 30000 })
    await page.assertPath('/settings/profile')

    // Verify user is now verified in database
    await user.refresh()
    assert.isNotNull(user.emailVerifiedAt)
  })

  test('verify-email-invalid-token: invalid/expired token redirects to login with error', async ({
    visit,
    route,
  }) => {
    const page = await visitPage(
      route('auth.email_verification.execute', { token: 'invalid-token' }),
      visit
    )

    await page.waitForURL(/\/login/)
    await page.assertPath('/login')
  })

  test('verify-email-expired-token: expired token redirects to login', async ({ visit, route }) => {
    const user = await createVerifiedUser({
      email: 'expired-verification@example.com',
      password: 'Password123!',
    })

    // Create expired token with proper selector.validator format
    const selector = 'expired-selector'
    const validator = 'expired-validator'
    const hashedValidator = await hash.make(validator)

    await Token.create({
      selector,
      token: hashedValidator,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      userId: user.id,
      expiresAt: DateTime.now().minus({ hours: 1 }),
    })

    const page = await visitPage(
      route('auth.email_verification.execute', { token: `${selector}.${validator}` }),
      visit
    )

    await page.waitForURL(/\/login/)
    await page.assertPath('/login')
  })
})
