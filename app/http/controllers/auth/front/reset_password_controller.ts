import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { resetPasswordValidator } from '#validators/auth'
import { regenerateCsrfToken } from '#helpers/auth/crsf'
import { I18nService } from '#services/i18n_service'
import { buildResetPasswordPayload } from '#helpers/i18n_payloads/reset_password'
import { FullToken } from '#types/core'
import { ValidatePasswordTokenAction } from '#actions/password/validate_password_token_action'
import { ResetPasswordAction } from '#actions/password/reset_password_action'

@inject()
export default class ResetPasswordController {
  constructor(
    protected i18n: I18nService,
    protected validatePasswordTokenAction: ValidatePasswordTokenAction,
    protected resetPasswordAction: ResetPasswordAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    await this.validatePasswordTokenAction.execute({ token: params.token as FullToken })

    return inertia.render('auth/front/reset_password', {
      token: params.token,
      translations: buildResetPasswordPayload(this.i18n),
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, auth } = ctx

    const payload = await resetPasswordValidator.validate(request.all())

    const user = await this.resetPasswordAction.execute({
      ...payload,
      token: payload.token as FullToken,
    })

    await auth.use('web').login(user)
    regenerateCsrfToken(ctx)

    session.flash('success', this.i18n.translate('auth.reset_password.success'))
    return response.redirect().toRoute('settings.profile.render')
  }
}
