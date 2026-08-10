import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { registerValidator } from '#validators/auth'
import { regenerateCsrfToken } from '#helpers/auth/crsf'
import { I18nService } from '#services/i18n_service'
import { buildRegisterPayload } from '#helpers/i18n_payloads/register'
import { enabledProviders } from '#helpers/auth/oauth'
import { RegisterUserAction } from '#actions/auth/register_user_action'
import { SendEmailVerificationAction } from '#actions/email_verification/send_email_verification_action'

@inject()
export default class RegisterController {
  constructor(
    protected i18n: I18nService,
    protected registerUserAction: RegisterUserAction,
    protected sendEmailVerificationAction: SendEmailVerificationAction
  ) {}

  render(ctx: HttpContext) {
    const { inertia } = ctx

    return inertia.render('auth/front/register', {
      providers: enabledProviders,
      translations: buildRegisterPayload(this.i18n),
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, auth, session } = ctx

    const payload = await registerValidator.validate(request.all())

    const user = await this.registerUserAction.execute({
      ...payload,
      locale: this.i18n.getLocale(),
    })

    await auth.use('web').login(user)
    regenerateCsrfToken(ctx)

    await this.sendEmailVerificationAction.execute({ user })

    session.flash('success', this.i18n.translate('auth.session.register.success'))

    return response.redirect().toRoute('settings.profile.render')
  }
}
