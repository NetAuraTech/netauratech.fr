import { inject } from '@adonisjs/core'
import type InitiateEmailChange from '#events/account/initiate_email_change'
import AccountNotification from '#mails/account/account_notification'
import { TOKEN_TYPES } from '#types/core'
import env from '#start/env'
import { routePath } from '#helpers/router/route_path'
import i18nManager from '@adonisjs/i18n/services/main'
import { MailService } from '#services/mails/mail_service'
import { GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import { TokenRepository } from '#repositories/core/token_repository'
import { BaseTokenListener } from '#listeners/auth/base_token_listener'

@inject()
export default class SendChangeEmailConfirmationEmail extends BaseTokenListener {
  protected tokenType = TOKEN_TYPES.EMAIL_CHANGE
  protected expiresInHours = 24
  protected mailClass = AccountNotification

  constructor(
    mailService: MailService,
    getPreferencesAction: GetPreferencesAction,
    tokenRepository: TokenRepository
  ) {
    super(mailService, getPreferencesAction, tokenRepository)
  }

  protected buildMailPayload(
    event: InitiateEmailChange,
    locale: string,
    token: string
  ): Record<string, any> {
    return {
      user: { email: event.user.pendingEmail!, locale },
      confirmation_link: `${env.get('APP_URL')}${
        routePath('settings.email_change.render', { token }) ?? ''
      }`,
    }
  }

  protected getTranslationKeys(
    event: InitiateEmailChange,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string> {
    return {
      subject: i18n.t('settings.email.change.mail.confirm.subject'),
      greeting: i18n.t('settings.email.change.mail.confirm.greeting'),
      intro: i18n.t('settings.email.change.mail.confirm.intro', {
        email: event.user.pendingEmail,
      }),
      action: i18n.t('settings.email.change.mail.confirm.action'),
      outro: i18n.t('settings.email.change.mail.confirm.outro'),
      expiry: i18n.t('settings.email.change.mail.confirm.expiry', { hours: 24 }),
      footer: i18n.t('settings.email.change.mail.confirm.footer'),
    }
  }
}
