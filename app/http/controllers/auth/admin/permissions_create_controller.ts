import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { CreatePermissionAction } from '#actions/permission/create_permission_action'
import { createPermissionValidator } from '#validators/permission'
import { I18nService } from '#services/i18n_service'
import { buildPermissionsFormPayload } from '#helpers/i18n_payloads/permissions_form'

@inject()
export default class PermissionsCreateController {
  constructor(
    protected i18n: I18nService,
    protected createPermissionAction: CreatePermissionAction
  ) {}

  /**
   * Renders the permission creation form.
   */
  async render(ctx: HttpContext) {
    const { inertia } = ctx

    return inertia.render('permission/admin/form', {
      permission: null,
      translations: buildPermissionsFormPayload(this.i18n),
    })
  }

  /**
   * Creates a custom permission.
   */
  async execute(ctx: HttpContext) {
    const { request, response, session } = ctx

    const payload = await createPermissionValidator.validate(request.all())

    await this.createPermissionAction.execute({
      name: payload.name,
      slug: payload.slug,
      category: payload.category,
      description: payload.description ?? null,
    })

    session.flash('success', this.i18n.translate('admin.permissions.flash.created'))

    return response.redirect().toRoute('admin.permissions.render')
  }
}
