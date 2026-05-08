import AccountNotification from '#mails/account/account_notification'
import env from '#start/env'
import { urlFor } from '@adonisjs/core/services/url_builder'
import InitiateEmailChange from '#events/account/initiate_email_change'
import { MailService } from '#services/mails/mail_service'
import { inject } from '@adonisjs/core'
import i18nManager from '@adonisjs/i18n/services/main'
import { TokenRepository } from '#repositories/core/token_repository'
import { generateSplitToken } from '#helpers/core/crypto'
import hash from '@adonisjs/core/services/hash'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import PreferencesService from '#services/preferences/preference_service'

@inject()
export default class SendChangeEmailConfirmationEmail {
  constructor(
    protected mailService: MailService,
    protected preferencesService: PreferencesService,
    protected tokenRepository: TokenRepository
  ) {}

  async handle(event: InitiateEmailChange) {
    const preferences = await this.preferencesService.get(event.user)

    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    await this.tokenRepository.expireEmailChangeTokens(event.user)

    const { selector, validator, token } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await this.tokenRepository.create({
      userId: event.user.id,
      type: TOKEN_TYPES.EMAIL_CHANGE,
      selector: selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ hours: 24 }),
    })

    const payload = new AccountNotification({
      user: {
        email: event.user.pendingEmail!,
        locale,
      },
      confirmation_link: `${env.get('APP_URL')}${urlFor('settings.email_change.render', { token: token })}`,
      translations: {
        subject: i18n.t('settings.email.change.mail.confirm.subject'),
        greeting: i18n.t('settings.email.change.mail.confirm.greeting'),
        intro: i18n.t('settings.email.change.mail.confirm.intro', {
          email: event.user.pendingEmail,
        }),
        action: i18n.t('settings.email.change.mail.confirm.action'),
        outro: i18n.t('settings.email.change.mail.confirm.outro'),
        expiry: i18n.t('settings.email.change.mail.confirm.expiry', { hours: 24 }),
        footer: i18n.t('settings.email.change.mail.confirm.footer'),
      },
    })

    await this.mailService.send(payload)
  }
}
