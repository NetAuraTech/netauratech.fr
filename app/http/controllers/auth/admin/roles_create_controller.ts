import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { CreateRoleAction } from '#actions/role/create_role_action'
import { ListAllPermissionsAction } from '#actions/permission/list_all_permissions_action'
import { createRoleValidator } from '#validators/role'
import { I18nService } from '#services/i18n_service'
import PermissionTransformer from '#transformers/permission_transformer'
import { buildRolesFormPayload } from '#helpers/i18n_payloads/roles_form'

@inject()
export default class RolesCreateController {
  constructor(
    protected i18n: I18nService,
    protected createRoleAction: CreateRoleAction,
    protected listAllPermissionsAction: ListAllPermissionsAction
  ) {}

  /**
   * Renders the role creation form with the permissions checkboxes grouped by category.
   */
  async render(ctx: HttpContext) {
    const { inertia } = ctx

    const permissions = await this.listAllPermissionsAction.execute()

    return inertia.render('role/admin/form', {
      role: null,
      permissions: PermissionTransformer.transform(permissions),
      translations: buildRolesFormPayload(this.i18n, permissions),
    })
  }

  /**
   * Creates a custom role and assigns its initial permissions.
   */
  async execute(ctx: HttpContext) {
    const { request, response, session } = ctx

    const payload = await createRoleValidator.validate(request.all())

    const role = await this.createRoleAction.execute({
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      permissionIds: payload.permission_ids,
    })

    session.flash('success', this.i18n.translate('admin.roles.flash.created'))

    return response.redirect().toRoute('admin.roles_show.render', { id: role.id })
  }
}
