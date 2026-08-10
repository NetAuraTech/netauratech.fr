import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { resetPasswordValidator } from '#validators/auth'
import { FullToken } from '#types/core'
import { ResetPasswordAction } from '#actions/password/reset_password_action'

/**
 * POST /api/v1/auth/reset-password — confirm a password reset with a token.
 * Returns 404 when the token is invalid or has expired.
 */
@inject()
export default class ResetPasswordApiController {
  constructor(protected resetPasswordAction: ResetPasswordAction) {}

  async store(ctx: HttpContext) {
    const { request, response } = ctx

    const payload = await resetPasswordValidator.validate(request.all())

    await this.resetPasswordAction.execute({ ...payload, token: payload.token as FullToken })

    return response.ok({ message: 'password_reset' })
  }
}
