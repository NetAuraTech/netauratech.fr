import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { CreateRoleAction } from '#actions/role/create_role_action'
import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import { createRoleValidator } from '#validators/role'
import RoleTransformer from '#transformers/role_transformer'

/**
 * POST /api/v1/admin/roles — create a role from the admin REST API.
 */
@inject()
export default class RolesCreateApiController {
  constructor(
    protected createRoleAction: CreateRoleAction,
    protected getRoleDetailAction: GetRoleDetailAction
  ) {}

  async store(ctx: HttpContext) {
    const { request, response, serialize } = ctx

    const payload = await createRoleValidator.validate(request.all())

    const created = await this.createRoleAction.execute({
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      permissionIds: payload.permission_ids,
    })

    const role = await this.getRoleDetailAction.execute({ id: created.id })

    const serialized = await serialize(RoleTransformer.transform(role))

    return response.created(serialized)
  }
}
