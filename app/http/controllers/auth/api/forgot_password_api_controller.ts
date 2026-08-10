import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { forgotPasswordValidator } from '#validators/auth'
import { FindUserByEmailAction } from '#actions/user/find_user_by_email_action'
import { SendPasswordResetAction } from '#actions/password/send_password_reset_action'

/**
 * POST /api/v1/auth/forgot-password — request a password-reset email.
 * Always returns 200 (even for unknown emails) to avoid account enumeration.
 */
@inject()
export default class ForgotPasswordApiController {
  constructor(
    protected findUserByEmailAction: FindUserByEmailAction,
    protected sendPasswordResetAction: SendPasswordResetAction
  ) {}

  async store(ctx: HttpContext) {
    const { request, response } = ctx

    const payload = await forgotPasswordValidator.validate(request.all())

    const user = await this.findUserByEmailAction.execute({ email: payload.email })

    if (user) {
      await this.sendPasswordResetAction.execute({ user })
    }

    return response.ok({ message: 'reset_email_sent' })
  }
}
