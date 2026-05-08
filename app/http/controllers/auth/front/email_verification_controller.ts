import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { EmailVerificationService } from '#services/auth/email_verification_service'

@inject()
export default class EmailVerificationController {
  constructor(protected emailVerificationService: EmailVerificationService) {}
  async execute(ctx: HttpContext) {
    const { params, response, session, auth, i18n } = ctx

    const user = await this.emailVerificationService.verify(params.token)

    if (!user) {
      session.flash('error', i18n.t('core.token.invalid'))
      return response.redirect().toRoute('auth.session.render')
    }

    if (!auth.user) {
      await auth.use('web').login(user)
    }

    session.flash('success', i18n.t('auth.verify_email.success'))

    return response.redirect().toRoute('settings.profile.render')
  }
}
