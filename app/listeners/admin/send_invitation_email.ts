import { MailService } from '#services/mails/mail_service'
import PreferencesService from '#services/preferences/preference_service'
import { TokenRepository } from '#repositories/core/token_repository'
import { inject } from '@adonisjs/core'
import InviteUser from '#events/admin/invite_user'
import i18nManager from '@adonisjs/i18n/services/main'
import { generateSplitToken } from '#helpers/core/crypto'
import hash from '@adonisjs/core/services/hash'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import InviteNotification from '#mails/admin/invite_notification'
import env from '#start/env'
import { urlFor } from '@adonisjs/core/services/url_builder'

@inject()
export default class SendInvitationEmail {
  constructor(
    protected mailService: MailService,
    protected preferencesService: PreferencesService,
    protected tokenRepository: TokenRepository
  ) {}

  async handle(event: InviteUser) {
    const preferences = await this.preferencesService.get(event.user)

    const locale = preferences.locale || 'en'
    const i18n = i18nManager.locale(locale)

    await this.tokenRepository.expireInviteTokens(event.user)

    const { selector, validator, token } = generateSplitToken()
    const hashedValidator = await hash.make(validator)

    await this.tokenRepository.create({
      userId: event.user.id,
      type: TOKEN_TYPES.PENDING_INVITE,
      selector: selector,
      token: hashedValidator,
      attempts: 0,
      expiresAt: DateTime.now().plus({ days: 7 }),
    })

    const payload = new InviteNotification({
      user: {
        email: event.user.email,
        locale,
      },
      accept_link: `${env.get('APP_URL')}${urlFor('auth.accept_invitation.render', { token: token })}`,
      translations: {
        subject: i18n.t('cms.users.mail.subject', {
          app: env.get('APP_NAME'),
        }),
        greeting: i18n.t('cms.users.mail.greeting'),
        intro: i18n.t('cms.users.mail.intro', {
          app: env.get('APP_NAME'),
        }),
        action: i18n.t('cms.users.mail.action'),
        outro: i18n.t('cms.users.mail.outro'),
        expiry: i18n.t('cms.users.mail.expiry', { days: 7 }),
        footer: i18n.t('cms.users.mail.footer'),
      },
    })

    await this.mailService.send(payload)
  }
}
