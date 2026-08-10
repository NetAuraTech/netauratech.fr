import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { UpdateRoleAction } from '#actions/role/update_role_action'
import { GetRoleDetailAction } from '#actions/role/get_role_detail_action'
import { ListAllPermissionsAction } from '#actions/permission/list_all_permissions_action'
import SystemRoleImmutableException from '#exceptions/auth/system_role_immutable_exception'
import { editRoleValidator, updateRoleValidator } from '#validators/role'
import { I18nService } from '#services/i18n_service'
import PermissionTransformer from '#transformers/permission_transformer'
import RoleTransformer from '#transformers/role_transformer'
import { buildRolesFormPayload } from '#helpers/i18n_payloads/roles_form'

@inject()
export default class RolesUpdateController {
  constructor(
    protected i18n: I18nService,
    protected updateRoleAction: UpdateRoleAction,
    protected getRoleDetailAction: GetRoleDetailAction,
    protected listAllPermissionsAction: ListAllPermissionsAction
  ) {}

  /**
   * Renders the role edit form. System roles are rejected before rendering.
   */
  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    const payload = await editRoleValidator.validate(params)

    const role = await this.getRoleDetailAction.execute({ id: payload.id })

    if (!role.canBeModified) {
      throw new SystemRoleImmutableException(role.slug)
    }

    const permissions = await this.listAllPermissionsAction.execute()

    return inertia.render('role/admin/form', {
      role: RoleTransformer.transform(role),
      permissions: PermissionTransformer.transform(permissions),
      translations: buildRolesFormPayload(this.i18n, permissions),
    })
  }

  /**
   * Updates a custom role and syncs its permissions.
   */
  async execute(ctx: HttpContext) {
    const { request, response, session, params } = ctx

    const { id } = await editRoleValidator.validate(params)
    const payload = await updateRoleValidator(id).validate(request.all())

    await this.updateRoleAction.execute({
      id,
      name: payload.name,
      slug: payload.slug,
      description: payload.description ?? null,
      permissionIds: payload.permission_ids,
    })

    session.flash('success', this.i18n.translate('admin.roles.flash.updated'))

    return response.redirect().toRoute('admin.roles_show.render', { id })
  }
}
