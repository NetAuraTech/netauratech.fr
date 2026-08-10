import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import UserTransformer from '#transformers/user_transformer'
import { preloadUserRoleWithPermissions } from '#helpers/auth/load_user_role'

/**
 * Identity endpoint of the REST API (`/api/v1/auth`).
 */
@inject()
export default class MeController {
  /**
   * GET /api/v1/auth/me
   *
   * Returns the user authenticated by the `Authorization: Bearer` token,
   * serialized exactly like the session-based identity payloads (role and
   * permissions included).
   */
  async show(ctx: HttpContext) {
    const user = ctx.auth.use('api').getUserOrFail()

    await preloadUserRoleWithPermissions(user)

    return ctx.serialize(UserTransformer.transform(user))
  }
}
