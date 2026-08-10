import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { ListAllPermissionsAction } from '#actions/permission/list_all_permissions_action'
import PermissionTransformer from '#transformers/permission_transformer'

/**
 * GET /api/v1/admin/permissions — list all permissions from the admin REST API.
 */
@inject()
export default class PermissionsApiController {
  constructor(protected listAllPermissionsAction: ListAllPermissionsAction) {}

  async index(ctx: HttpContext) {
    const { serialize } = ctx

    const permissions = await this.listAllPermissionsAction.execute()

    return serialize(PermissionTransformer.transform(permissions))
  }
}
