import { MailService } from '#services/mails/mail_service'
import { TokenRepository } from '#repositories/core/token_repository'
import i18nManager from '@adonisjs/i18n/services/main'
import { generateSplitToken } from '#helpers/core/crypto'
import hash from '@adonisjs/core/services/hash'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import AuthNotification from '#mails/auth/auth_notification'
import env from '#start/env'
import { urlFor } from '@adonisjs/core/services/url_builder'
import ForgotPassword from '#events/auth/forgot_password'
import { inject } from '@adonisjs/core'
import PreferencesService from '#services/preferences/preference_service'

@inject()
export default class SendForgotPasswordEmail {
  constructor(
    protected mailService: MailService,
    protected preferencesService: PreferencesService,
    protected tokenRepository: TokenRepository
  ) {}

  async handle(event: ForgotPassword) {
    const preferences = await this.preferencesService.get(event.user)

    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    await this.tokenRepository.expirePasswordResetTokens(event.user)

    const { selector, validator, token } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await this.tokenRepository.create({
      userId: event.user.id,
      type: TOKEN_TYPES.PASSWORD_RESET,
      selector: selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 1 }),
    })

    const payload = new AuthNotification({
      user: {
        email: event.user.email,
        locale,
      },
      reset_link: `${env.get('APP_URL')}${urlFor('auth.reset_password.render', { token: token })}`,
      translations: {
        subject: i18n.t('auth.reset_password.mail.subject'),
        greeting: i18n.t('auth.reset_password.mail.greeting'),
        intro: i18n.t('auth.reset_password.mail.intro'),
        action: i18n.t('auth.reset_password.mail.action'),
        outro: i18n.t('auth.reset_password.mail.outro'),
        expiry: i18n.t('auth.reset_password.mail.expiry', { hours: 1 }),
        footer: i18n.t('auth.reset_password.mail.footer'),
      },
    })

    await this.mailService.send(payload)
  }
}
