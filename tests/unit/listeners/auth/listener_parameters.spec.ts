import { test } from '@japa/runner'
import app from '@adonisjs/core/services/app'
import SendVerificationEmail from '#listeners/auth/send_verification_email'
import SendForgotPasswordEmail from '#listeners/auth/send_forgot_password_email'
import SendInvitationEmail from '#listeners/admin/send_invitation_email'
import SendChangeEmailConfirmationEmail from '#listeners/account/send_change_email_confirmation_email'
import { TOKEN_TYPES } from '#types/core'

test.group('Token Listeners - Parameter Verification', () => {
  test('SendVerificationEmail provides correct parameters', async ({ assert }) => {
    const listener = await app.container.make(SendVerificationEmail)
    assert.equal(listener.getTokenType, TOKEN_TYPES.EMAIL_VERIFICATION)
    assert.equal(listener.getExpiresInHours, 24)
  })

  test('SendForgotPasswordEmail provides correct parameters', async ({ assert }) => {
    const listener = await app.container.make(SendForgotPasswordEmail)
    assert.equal(listener.getTokenType, TOKEN_TYPES.PASSWORD_RESET)
    assert.equal(listener.getExpiresInHours, 1)
  })

  test('SendInvitationEmail provides correct parameters', async ({ assert }) => {
    const listener = await app.container.make(SendInvitationEmail)
    assert.equal(listener.getTokenType, TOKEN_TYPES.PENDING_INVITE)
    assert.equal(listener.getExpiresInHours, 7 * 24)
  })

  test('SendChangeEmailConfirmationEmail provides correct parameters', async ({ assert }) => {
    const listener = await app.container.make(SendChangeEmailConfirmationEmail)
    assert.equal(listener.getTokenType, TOKEN_TYPES.EMAIL_CHANGE)
    assert.equal(listener.getExpiresInHours, 24)
  })
})
