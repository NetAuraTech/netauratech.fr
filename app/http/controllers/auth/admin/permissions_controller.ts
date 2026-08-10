import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListAllPermissionsAction } from '#actions/permission/list_all_permissions_action'
import { DeletePermissionAction } from '#actions/permission/delete_permission_action'
import { deletePermissionValidator } from '#validators/permission'
import { I18nService } from '#services/i18n_service'
import PermissionTransformer from '#transformers/permission_transformer'
import { buildPermissionsListPayload } from '#helpers/i18n_payloads/permissions_list'

@inject()
export default class PermissionsController {
  constructor(
    protected i18n: I18nService,
    protected listAllPermissionsAction: ListAllPermissionsAction,
    protected deletePermissionAction: DeletePermissionAction
  ) {}

  /**
   * Renders the permissions listing page, grouped by category on the frontend.
   */
  async render(ctx: HttpContext) {
    const { inertia } = ctx

    const permissions = await this.listAllPermissionsAction.execute()

    return inertia.render('permission/admin/index', {
      permissions: PermissionTransformer.transform(permissions),
      translations: buildPermissionsListPayload(this.i18n, permissions),
    })
  }

  /**
   * Deletes a custom permission, revoking it from every role via the pivot cascade.
   */
  async destroy(ctx: HttpContext) {
    const { response, params, session } = ctx

    const payload = await deletePermissionValidator.validate(params)

    await this.deletePermissionAction.execute({ id: payload.id })

    session.flash('success', this.i18n.translate('admin.permissions.flash.deleted'))

    return response.redirect().toRoute('admin.permissions.render')
  }
}
