import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import { ListAllPermissionsAction } from '#actions/permission/list_all_permissions_action'
import { buildRolesShowPayload } from '#helpers/i18n_payloads/roles_show'
import { I18nService } from '#services/i18n_service'
import RoleTransformer from '#transformers/role_transformer'
import { showRoleValidator } from '#validators/role'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'

@inject()
export default class RolesShowController {
  constructor(
    protected getRoleDetailAction: GetRoleDetailAction,
    protected listAllPermissionsAction: ListAllPermissionsAction,
    protected i18nService: I18nService
  ) {}

  /**
   * Renders the role detail page with its users and permissions grouped by category.
   */
  async render(ctx: HttpContext) {
    const { id } = await showRoleValidator.validate(ctx.params)

    const role = await this.getRoleDetailAction.execute({ id })
    const permissions = await this.listAllPermissionsAction.execute()

    return ctx.inertia.render('role/admin/show', {
      role: RoleTransformer.transform(role),
      translations: buildRolesShowPayload(this.i18nService, role, permissions),
    })
  }
}
