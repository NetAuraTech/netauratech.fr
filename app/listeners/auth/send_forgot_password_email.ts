import { inject } from '@adonisjs/core'
import type ForgotPassword from '#events/auth/forgot_password'
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
export default class SendForgotPasswordEmail extends BaseTokenListener {
  protected tokenType = TOKEN_TYPES.PASSWORD_RESET
  protected expiresInHours = 1
  protected mailClass = AuthNotification

  constructor(
    mailService: MailService,
    getPreferencesAction: GetPreferencesAction,
    tokenRepository: TokenRepository
  ) {
    super(mailService, getPreferencesAction, tokenRepository)
  }

  protected buildMailPayload(
    _event: ForgotPassword,
    _locale: string,
    token: string
  ): Record<string, any> {
    return {
      reset_link: `${env.get('APP_URL')}${
        routePath('auth.reset_password.render', { token }) ??
        routePath('api.v1.auth.reset_password_api.store', { token }) ??
        ''
      }`,
    }
  }

  protected getTranslationKeys(
    _event: ForgotPassword,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string> {
    return {
      subject: i18n.t('auth.reset_password.mail.subject'),
      greeting: i18n.t('auth.reset_password.mail.greeting'),
      intro: i18n.t('auth.reset_password.mail.intro'),
      action: i18n.t('auth.reset_password.mail.action'),
      outro: i18n.t('auth.reset_password.mail.outro'),
      expiry: i18n.t('auth.reset_password.mail.expiry', { hours: 1 }),
      footer: i18n.t('auth.reset_password.mail.footer'),
    }
  }
}
