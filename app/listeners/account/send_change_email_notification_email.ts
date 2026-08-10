import { inject } from '@adonisjs/core'
import { MailService } from '#services/mails/mail_service'
import InitiateEmailChange from '#events/account/initiate_email_change'
import i18nManager from '@adonisjs/i18n/services/main'
import env from '#start/env'
import AccountNotification from '#mails/account/account_notification'
import { GetPreferencesAction } from '#actions/preferences/get_preferences_action'

@inject()
export default class SendChangeEmailNotificationEmail {
  constructor(
    protected mailService: MailService,
    protected getPreferencesAction: GetPreferencesAction
  ) {}

  async handle(event: InitiateEmailChange) {
    const preferences = await this.getPreferencesAction.execute({ user: event.user })

    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    const payload = new AccountNotification({
      user: {
        email: event.user.email,
        locale,
      },
      translations: {
        subject: i18n.t('settings.email.change.mail.notification.subject'),
        greeting: i18n.t('settings.email.change.mail.notification.greeting'),
        intro: i18n.t('settings.email.change.mail.notification.intro', {
          old: event.user.email,
          new: event.user.pendingEmail,
        }),
        warning: i18n.t('settings.email.change.mail.notification.warning'),
        action: i18n.t('settings.email.change.mail.notification.action'),
        support: env.get('MAIL_FROM_ADDRESS'),
      },
    })

    await this.mailService.send(payload)
  }
}
