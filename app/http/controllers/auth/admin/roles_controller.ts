import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListRolesAction } from '#actions/role/list_roles_action'
import { DeleteRoleAction } from '#actions/role/delete_role_action'
import { deleteRoleValidator, listRolesValidator } from '#validators/role'
import { I18nService } from '#services/i18n_service'
import RoleTransformer from '#transformers/role_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import { buildRolesListPayload } from '#helpers/i18n_payloads/roles_list'

@inject()
export default class RolesController {
  constructor(
    protected i18n: I18nService,
    protected listRolesAction: ListRolesAction,
    protected deleteRoleAction: DeleteRoleAction
  ) {}

  /**
   * Renders the roles listing page with permission and user counts per role.
   */
  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    const pagination = await extractPagination(request)

    const data = stripEmptyStrings(request.all())

    const payload = await listRolesValidator.validate(data)

    const roles = await this.listRolesAction.execute({
      search: payload.search,
      pagination,
    })

    return inertia.render('role/admin/index', {
      roles: RoleTransformer.paginate(roles.all(), roles.getMeta()),
      filters: payload,
      translations: buildRolesListPayload(this.i18n, roles.all()),
    })
  }

  /**
   * Deletes a custom role after reassigning its users to the fallback role.
   */
  async destroy(ctx: HttpContext) {
    const { response, params, session } = ctx

    const payload = await deleteRoleValidator.validate(params)

    await this.deleteRoleAction.execute({ id: payload.id })

    session.flash('success', this.i18n.translate('admin.roles.flash.deleted'))

    return response.redirect().toRoute('admin.roles.render')
  }
}
