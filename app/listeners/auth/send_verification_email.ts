import { inject } from '@adonisjs/core'
import { MailService } from '#services/mails/mail_service'
import { generateSplitToken } from '#helpers/core/crypto'
import hash from '@adonisjs/core/services/hash'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import { TokenRepository } from '#repositories/core/token_repository'
import UserRegistered from '#events/auth/user_registered'
import AuthNotification from '#mails/auth/auth_notification'
import { urlFor } from '@adonisjs/core/services/url_builder'
import i18nManager from '@adonisjs/i18n/services/main'
import env from '#start/env'
import PreferencesService from '#services/preferences/preference_service'

@inject()
export default class SendVerificationEmail {
  constructor(
    protected mailService: MailService,
    protected preferencesService: PreferencesService,
    protected tokenRepository: TokenRepository
  ) {}

  async handle(event: UserRegistered) {
    const preferences = await this.preferencesService.get(event.user)

    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    await this.tokenRepository.expireEmailVerificationTokens(event.user)

    const { selector, validator, token } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await this.tokenRepository.create({
      userId: event.user.id,
      type: TOKEN_TYPES.EMAIL_VERIFICATION,
      selector: selector,
      token: hashedValidator,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const payload = new AuthNotification({
      user: {
        email: event.user.email,
        locale,
      },
      verification_link: `${env.get('APP_URL')}${urlFor('auth.email_verification.execute', { token: token })}`,
      translations: {
        subject: i18n.t('auth.verify_email.mail.subject'),
        greeting: i18n.t('auth.verify_email.mail.greeting'),
        intro: i18n.t('auth.verify_email.mail.intro'),
        action: i18n.t('auth.verify_email.mail.action'),
        outro: i18n.t('auth.verify_email.mail.outro'),
        expiry: i18n.t('auth.verify_email.mail.expiry', { hours: 24 }),
        footer: i18n.t('auth.verify_email.mail.footer'),
      },
    })

    await this.mailService.send(payload)
  }
}
