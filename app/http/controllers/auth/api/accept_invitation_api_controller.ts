import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { invitationValidator, acceptInvitationValidator } from '#validators/auth'
import InvalidTokenException from '#exceptions/core/invalid_token_exception'
import { FullToken } from '#types/core'
import UserTransformer from '#transformers/user_transformer'
import { preloadUserRoleWithPermissions } from '#helpers/auth/load_user_role'
import { invalidTokenNotFound } from '#helpers/api/error_response'
import { GetInvitationAction } from '#actions/invitation/get_invitation_action'
import { AcceptInvitationAction } from '#actions/invitation/accept_invitation_action'

/**
 * POST /api/v1/auth/accept-invitation — accept an invitation and set a password.
 * Returns a canonical 404 error body when the token is invalid.
 */
@inject()
export default class AcceptInvitationApiController {
  constructor(
    protected getInvitationAction: GetInvitationAction,
    protected acceptInvitationAction: AcceptInvitationAction
  ) {}

  async store(ctx: HttpContext) {
    const { request, response, serialize } = ctx

    const { token } = await invitationValidator.validate(request.only(['token']))

    let invitedUser
    try {
      invitedUser = await this.getInvitationAction.execute({ token: token as FullToken })
    } catch (error) {
      if (error instanceof InvalidTokenException) {
        return invalidTokenNotFound(ctx)
      }
      throw error
    }

    const payload = await acceptInvitationValidator(invitedUser.id).validate(request.all())

    const user = await this.acceptInvitationAction.execute({
      token: token as FullToken,
      password: payload.password,
    })

    await preloadUserRoleWithPermissions(user)

    const serialized = await serialize(UserTransformer.transform(user))

    return response.ok(serialized)
  }
}
