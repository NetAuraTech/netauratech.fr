import { MailService } from '#services/mails/mail_service'
import ContactFormSubmitted from '#events/page/contact_form_submitted'
import i18nManager from '@adonisjs/i18n/services/main'
import ContactFormNotification from '#mails/page/contact_form_notification'
import env from '#start/env'
import { inject } from '@adonisjs/core'
import PreferencesService from '#services/preferences/preference_service'
import { UserRepository } from '#repositories/auth/user_repository'

@inject()
export default class SendContactFormEmail {
  constructor(
    protected mailService: MailService,
    protected preferencesService: PreferencesService,
    protected userRepository: UserRepository
  ) {}

  async handle(event: ContactFormSubmitted) {
    type SubmissionKeys = keyof typeof event.submission
    const admin = await this.userRepository.findByEmail(env.get('MAIL_FROM_ADDRESS'))

    let locale = 'en'

    if (admin) {
      const preferences = await this.preferencesService.get(admin)

      locale = preferences.locale
    }

    const i18n = i18nManager.locale(locale)

    const payload = new ContactFormNotification({
      user: {
        email: env.get('MAIL_FROM_ADDRESS'),
        locale: locale,
      },
      data: (Object.entries(event.submission) as [SubmissionKeys, any][]).reduce(
        (acc, [key, value]) => {
          acc[key] = i18n.t(
            `page.contact_form.mail.${key as string}`,
            { value },
            `${key}: ${value}`
          )
          return acc
        },
        {} as Record<SubmissionKeys, string>
      ),
      translations: {
        subject: i18n.t('page.contact_form.mail.subject'),
        greeting: i18n.t('page.contact_form.mail.greeting'),
        intro: i18n.t('page.contact_form.mail.intro'),
      },
    })

    await this.mailService.send(payload)
  }
}
