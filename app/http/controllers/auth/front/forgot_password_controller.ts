import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { forgotPasswordValidator } from '#validators/auth'
import User from '#models/auth/user'
import { PasswordService } from '#services/auth/password_service'

@inject()
export default class ForgotPasswordController {
  constructor(protected passwordService: PasswordService) {}

  render(ctx: HttpContext) {
    const { inertia, i18n } = ctx

    return inertia.render('auth/front/forgot_password', {
      translations: {
        title: i18n.t('auth.password.forgot.title'),
        sub_title: i18n.t('auth.password.forgot.sub_title'),
        email: {
          value: i18n.t('auth.password.forgot.email.value'),
          placeholder: i18n.t('auth.password.forgot.email.placeholder'),
        },
        submit: i18n.t('auth.password.forgot.submit'),
        back_to_login: i18n.t('auth.password.forgot.back_to_login'),
      },
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const payload = await forgotPasswordValidator.validate(request.all())

    const user = await User.findBy('email', payload.email)

    if (user) {
      await this.passwordService.send(user)
    }

    session.flash('success', i18n.t('auth.password.forgot.email_sent'))

    return response.redirect().toRoute('auth.session.render')
  }
}
