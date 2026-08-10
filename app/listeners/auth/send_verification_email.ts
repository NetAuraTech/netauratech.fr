import { inject } from '@adonisjs/core'
import type UserRegistered from '#events/auth/user_registered'
import AuthNotification from '#mails/auth/auth_notification'
import { TOKEN_TYPES } from '#types/core'
import env from '#start/env'
import { routePath } from '#helpers/router/route_path'
import i18nManager from '@adonisjs/i18n/services/main'
import { MailService } from '#services/mails/mail_service'
import { GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import { TokenRepository } from '#repositories/core/token_repository'
import { BaseTokenListener } from '#listeners/auth/base_token_listener'

@inject()
export default class SendVerificationEmail extends BaseTokenListener {
  protected tokenType = TOKEN_TYPES.EMAIL_VERIFICATION
  protected expiresInHours = 24
  protected mailClass = AuthNotification

  constructor(
    mailService: MailService,
    getPreferencesAction: GetPreferencesAction,
    tokenRepository: TokenRepository
  ) {
    super(mailService, getPreferencesAction, tokenRepository)
  }

  protected buildMailPayload(
    _event: UserRegistered,
    _locale: string,
    token: string
  ): Record<string, any> {
    return {
      verification_link: `${env.get('APP_URL')}${
        routePath('auth.email_verification.execute', { token }) ??
        routePath('api.v1.auth.email_verification_api.store', { token }) ??
        ''
      }`,
    }
  }

  protected getTranslationKeys(
    _event: UserRegistered,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string> {
    return {
      subject: i18n.t('auth.verify_email.mail.subject'),
      greeting: i18n.t('auth.verify_email.mail.greeting'),
      intro: i18n.t('auth.verify_email.mail.intro'),
      action: i18n.t('auth.verify_email.mail.action'),
      outro: i18n.t('auth.verify_email.mail.outro'),
      expiry: i18n.t('auth.verify_email.mail.expiry', { hours: 24 }),
      footer: i18n.t('auth.verify_email.mail.footer'),
    }
  }
}
