import { inject } from '@adonisjs/core'
import type InviteUser from '#events/admin/invite_user'
import InviteNotification from '#mails/admin/invite_notification'
import { TOKEN_TYPES } from '#types/core'
import env from '#start/env'
import { routePath } from '#helpers/router/route_path'
import i18nManager from '@adonisjs/i18n/services/main'
import { MailService } from '#services/mails/mail_service'
import { GetPreferencesAction } from '#actions/preferences/get_preferences_action'
import { TokenRepository } from '#repositories/core/token_repository'
import { BaseTokenListener } from '#listeners/auth/base_token_listener'

@inject()
export default class SendInvitationEmail extends BaseTokenListener {
  protected tokenType = TOKEN_TYPES.PENDING_INVITE
  protected expiresInHours = 7 * 24 // 7 days
  protected mailClass = InviteNotification

  constructor(
    mailService: MailService,
    getPreferencesAction: GetPreferencesAction,
    tokenRepository: TokenRepository
  ) {
    super(mailService, getPreferencesAction, tokenRepository)
  }

  protected buildMailPayload(
    _event: InviteUser,
    _locale: string,
    token: string
  ): Record<string, any> {
    return {
      accept_link: `${env.get('APP_URL')}${
        routePath('auth.accept_invitation.render', { token }) ??
        routePath('api.v1.auth.accept_invitation_api.store', { token }) ??
        ''
      }`,
    }
  }

  protected getTranslationKeys(
    _event: InviteUser,
    i18n: ReturnType<typeof i18nManager.locale>
  ): Record<string, string> {
    return {
      subject: i18n.t('admin.users.mail.subject', { app: env.get('APP_NAME') }),
      greeting: i18n.t('admin.users.mail.greeting'),
      intro: i18n.t('admin.users.mail.intro', { app: env.get('APP_NAME') }),
      action: i18n.t('admin.users.mail.action'),
      outro: i18n.t('admin.users.mail.outro'),
      expiry: i18n.t('admin.users.mail.expiry', { days: 7 }),
      footer: i18n.t('admin.users.mail.footer'),
    }
  }
}
