import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { UpdateRoleAction } from '#actions/role/update_role_action'
import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import { restRoleIdValidator, updateRoleValidator } from '#validators/role'
import RoleTransformer from '#transformers/role_transformer'

/**
 * PUT /api/v1/admin/roles/:id — update a role from the admin REST API.
 */
@inject()
export default class RolesUpdateApiController {
  constructor(
    protected updateRoleAction: UpdateRoleAction,
    protected getRoleDetailAction: GetRoleDetailAction
  ) {}

  async update(ctx: HttpContext) {
    const { params, request, serialize } = ctx

    const { id } = await restRoleIdValidator.validate(params)

    const payload = await updateRoleValidator(id).validate(request.all())

    await this.updateRoleAction.execute({
      id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      permissionIds: payload.permission_ids,
    })

    const role = await this.getRoleDetailAction.execute({ id })

    return serialize(RoleTransformer.transform(role))
  }
}
