import { test } from '@japa/runner'
import { BaseNotification } from '#mails/base_notification'
import type { MailPayload } from '#types/mail'

class ConcreteTestNotification extends BaseNotification {
  get templatePath(): string {
    return 'emails/test_template'
  }
}

test.group('BaseNotification', () => {
  test('prepare() does not throw with valid payload', ({ assert }) => {
    const payload: MailPayload = {
      user: {
        email: 'test@example.com',
        locale: 'en',
      },
      translations: {
        subject: 'Test Subject',
        greeting: 'Hello',
        intro: 'Welcome!',
      },
      custom_field: 'custom_value',
    }

    const notification = new ConcreteTestNotification(payload)

    assert.doesNotThrow(() => {
      notification.prepare()
    })
  })

  test('prepare() handles empty translations', ({ assert }) => {
    const payload: MailPayload = {
      user: {
        email: 'test@example.com',
        locale: 'fr',
      },
      translations: {},
    }

    const notification = new ConcreteTestNotification(payload)

    assert.doesNotThrow(() => {
      notification.prepare()
    })
  })

  test('templatePath throws if not overridden', ({ assert }) => {
    class BadNotification extends BaseNotification {}
    const notif = new (BadNotification as any)({} as MailPayload)

    assert.throws(() => {
      void notif.templatePath
    }, 'templatePath must be overridden by subclass')
  })
})
