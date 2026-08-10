import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { registerValidator } from '#validators/auth'
import { I18nService } from '#services/i18n_service'
import { preloadUserRoleWithPermissions } from '#helpers/auth/load_user_role'
import { RegisterUserAction } from '#actions/auth/register_user_action'
import { SendEmailVerificationAction } from '#actions/email_verification/send_email_verification_action'
import UserTransformer from '#transformers/user_transformer'

/**
 * POST /api/v1/auth/register — public self-registration for API clients.
 * Creates the user and dispatches the email-verification flow.
 */
@inject()
export default class RegisterApiController {
  constructor(
    protected i18n: I18nService,
    protected registerUserAction: RegisterUserAction,
    protected sendEmailVerificationAction: SendEmailVerificationAction
  ) {}

  /**
   * Register a new user and dispatch the email-verification flow.
   */
  async store(ctx: HttpContext) {
    const { request, response, serialize } = ctx

    const payload = await registerValidator.validate(request.all())

    const user = await this.registerUserAction.execute({
      ...payload,
      locale: this.i18n.getLocale(),
    })

    await this.sendEmailVerificationAction.execute({ user })

    await preloadUserRoleWithPermissions(user)

    const serialized = await serialize(UserTransformer.transform(user))

    return response.created(serialized)
  }
}
