import { test } from '@japa/runner'
import AuthNotification from '#mails/auth/auth_notification'
import AccountNotification from '#mails/account/account_notification'
import InviteNotification from '#mails/admin/invite_notification'
import type { MailPayload } from '#types/mail'

const fixturePayload: MailPayload = {
  user: { email: 'user@example.com', locale: 'en' },
  translations: { subject: 'Test' },
}

test.group('Notification template paths', () => {
  test('AuthNotification uses auth_email template', ({ assert }) => {
    const notif = new AuthNotification(fixturePayload)
    assert.equal(notif.templatePath, 'emails/auth_email')
  })

  test('AccountNotification uses account_email template', ({ assert }) => {
    const notif = new AccountNotification(fixturePayload)
    assert.equal(notif.templatePath, 'emails/account_email')
  })

  test('InviteNotification uses admin_invite_email template', ({ assert }) => {
    const notif = new InviteNotification(fixturePayload)
    assert.equal(notif.templatePath, 'emails/admin_invite_email')
  })
})
