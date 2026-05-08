import type { HttpContext } from '@adonisjs/core/http'
import { AuthService } from '#services/auth/auth_service'
import { registerValidator } from '#validators/auth'
import { inject } from '@adonisjs/core'
import { regenerateCsrfToken } from '#helpers/auth/crsf'
import { EmailVerificationService } from '#services/auth/email_verification_service'
import { enabledProviders } from '#helpers/auth/oauth'

@inject()
export default class RegisterController {
  constructor(
    protected authService: AuthService,
    protected emailVerificationService: EmailVerificationService
  ) {}

  render(ctx: HttpContext) {
    const { inertia, i18n } = ctx

    return inertia.render('auth/front/register', {
      providers: enabledProviders,
      translations: {
        title: i18n.t('auth.register.title'),
        sub_title: i18n.t('auth.register.sub_title'),
        account: {
          has: i18n.t('auth.register.account.has'),
          login: i18n.t('auth.register.account.login'),
        },
        email: {
          value: i18n.t('auth.register.email.value'),
          placeholder: i18n.t('auth.register.email.placeholder'),
        },
        password: {
          value: i18n.t('auth.register.password.value'),
          help: i18n.t('auth.register.password.help'),
          confirmation: {
            value: i18n.t('auth.register.password.confirmation.value'),
            help: i18n.t('auth.register.password.confirmation.help'),
          },
        },
        submit: i18n.t('auth.register.submit'),
        or_continue_with: i18n.t('auth.register.or_continue_with'),
      },
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, auth, session, i18n } = ctx

    const payload = await registerValidator.validate(request.all())

    const user = await this.authService.register({
      ...payload,
      locale: ctx.i18n.locale,
    })

    await auth.use('web').login(user)
    regenerateCsrfToken(ctx)

    await this.emailVerificationService.send(user)

    session.flash('success', i18n.t('auth.session.register.success'))

    return response.redirect().toRoute('settings.profile.render')
  }
}
