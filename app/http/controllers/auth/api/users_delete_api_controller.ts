import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { DeleteUserAction } from '#actions/user/delete_user_action'
import { restIdValidator } from '#validators/user'

/**
 * DELETE /api/v1/admin/users/:id — delete a user from the admin REST API.
 *
 * Thin transport wrapper around the shared {@link DeleteUserAction}. Returns
 * `204 No Content` on success.
 */
@inject()
export default class UsersDeleteApiController {
  constructor(protected deleteUserAction: DeleteUserAction) {}

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx

    const { id } = await restIdValidator.validate(params)

    await this.deleteUserAction.execute({ id })

    return response.noContent()
  }
}
