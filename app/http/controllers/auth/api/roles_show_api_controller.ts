import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import { restRoleIdValidator } from '#validators/role'
import RoleTransformer from '#transformers/role_transformer'

/**
 * GET /api/v1/admin/roles/:id — show a role from the admin REST API.
 */
@inject()
export default class RolesShowApiController {
  constructor(protected getRoleDetailAction: GetRoleDetailAction) {}

  async show(ctx: HttpContext) {
    const { params, serialize } = ctx

    const { id } = await restRoleIdValidator.validate(params)

    const role = await this.getRoleDetailAction.execute({ id })

    return serialize(RoleTransformer.transform(role))
  }
}
