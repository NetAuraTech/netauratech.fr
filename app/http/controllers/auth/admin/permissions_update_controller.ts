import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { UpdatePermissionAction } from '#actions/permission/update_permission_action'
import { GetPermissionDetailAction } from '#actions/permission/get_permission_detail_action'
import SystemPermissionImmutableException from '#exceptions/auth/system_permission_immutable_exception'
import { editPermissionValidator, updatePermissionValidator } from '#validators/permission'
import { I18nService } from '#services/i18n_service'
import PermissionTransformer from '#transformers/permission_transformer'
import { buildPermissionsFormPayload } from '#helpers/i18n_payloads/permissions_form'

@inject()
export default class PermissionsUpdateController {
  constructor(
    protected i18n: I18nService,
    protected updatePermissionAction: UpdatePermissionAction,
    protected getPermissionDetailAction: GetPermissionDetailAction
  ) {}

  /**
   * Renders the permission edit form. System permissions are rejected before rendering.
   */
  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    const payload = await editPermissionValidator.validate(params)

    const permission = await this.getPermissionDetailAction.execute({ id: payload.id })

    if (permission.isSystem) {
      throw new SystemPermissionImmutableException(permission.slug)
    }

    return inertia.render('permission/admin/form', {
      permission: PermissionTransformer.transform(permission),
      translations: buildPermissionsFormPayload(this.i18n),
    })
  }

  /**
   * Updates a custom permission.
   */
  async execute(ctx: HttpContext) {
    const { request, response, session, params } = ctx

    const { id } = await editPermissionValidator.validate(params)
    const payload = await updatePermissionValidator(id).validate(request.all())

    await this.updatePermissionAction.execute({
      id,
      name: payload.name,
      slug: payload.slug,
      category: payload.category,
      description: payload.description ?? null,
    })

    session.flash('success', this.i18n.translate('admin.permissions.flash.updated'))

    return response.redirect().toRoute('admin.permissions.render')
  }
}
