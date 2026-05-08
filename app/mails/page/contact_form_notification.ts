import { BaseMail } from '@adonisjs/mail'
import type { MailPayload } from '#types/mail'

export default class ContactFormNotification extends BaseMail {
  constructor(private payload: MailPayload) {
    super()
  }

  prepare() {
    const { user, translations, ...rest } = this.payload
    const { email, locale } = user
    const { subject, ...translated } = translations

    this.message
      .to(email)
      .subject(subject || '')
      .htmlView('emails/contact_form_email', {
        locale: locale,
        app_name: process.env.APP_NAME || 'AdonisJS',
        subject,
        ...translated,
        ...rest,
      })
  }
}
