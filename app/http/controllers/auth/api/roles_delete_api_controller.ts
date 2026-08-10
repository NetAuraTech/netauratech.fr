import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { DeleteRoleAction } from '#actions/role/delete_role_action'
import { restRoleIdValidator } from '#validators/role'

/**
 * DELETE /api/v1/admin/roles/:id — delete a role from the admin REST API.
 */
@inject()
export default class RolesDeleteApiController {
  constructor(protected deleteRoleAction: DeleteRoleAction) {}

  async destroy(ctx: HttpContext) {
    const { params, response } = ctx

    const { id } = await restRoleIdValidator.validate(params)

    await this.deleteRoleAction.execute({ id })

    return response.noContent()
  }
}
