import { BaseMail } from '@adonisjs/mail'
import type { MailPayload } from '#types/mail'

/**
 * Abstract base class for email notifications.
 *
 * Encapsulates the common `prepare()` logic shared across all notification
 * mails — recipient, subject, template rendering — requiring subclasses
 * to provide only the template path.
 */
export abstract class BaseNotification extends BaseMail {
  constructor(protected payload: MailPayload) {
    super()
  }

  /** Subclasses override this with the email template path. */
  get templatePath(): string {
    throw new Error('templatePath must be overridden by subclass')
  }

  prepare() {
    const { user, translations, ...rest } = this.payload
    const { email, locale } = user
    const { subject, ...translated } = translations

    this.message
      .to(email)
      .subject(subject || '')
      .htmlView(this.templatePath, {
        locale,
        app_name: process.env.APP_NAME || 'AdonisJS',
        subject,
        ...translated,
        ...rest,
      })
  }
}
