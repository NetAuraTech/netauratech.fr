import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { ListRolesAction } from '#actions/role/list_roles_action'
import { listRolesValidator } from '#validators/role'
import RoleTransformer from '#transformers/role_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'

/**
 * GET /api/v1/admin/roles — list roles from the admin REST API.
 */
@inject()
export default class RolesApiController {
  constructor(protected listRolesAction: ListRolesAction) {}

  async index(ctx: HttpContext) {
    const { request, serialize } = ctx

    const pagination = await extractPagination(request)
    const data = stripEmptyStrings(request.all())

    const payload = await listRolesValidator.validate(data)

    const roles = await this.listRolesAction.execute({
      search: payload.search,
      pagination,
    })

    return serialize(RoleTransformer.paginate(roles.all(), roles.getMeta()))
  }
}
