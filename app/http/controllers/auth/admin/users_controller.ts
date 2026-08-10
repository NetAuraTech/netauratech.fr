import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { ListUsersAction } from '#actions/user/list_users_action'
import { DeleteUserAction } from '#actions/user/delete_user_action'
import { deleteValidator, listValidator } from '#validators/user'
import { I18nService } from '#services/i18n_service'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import UserTransformer from '#transformers/user_transformer'
import RoleTransformer from '#transformers/role_transformer'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import { buildUsersListPayload } from '#helpers/i18n_payloads/users_list'

@inject()
export default class UsersController {
  constructor(
    protected i18n: I18nService,
    protected listUsersAction: ListUsersAction,
    protected deleteUserAction: DeleteUserAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, request } = ctx

    const pagination = await extractPagination(request)

    const roles = await this.listAllRolesAction.execute()
    const allowed = roles.map((role) => String(role.id))

    const data = stripEmptyStrings(request.all())

    const payload = await listValidator(allowed).validate(data)

    const users = await this.listUsersAction.execute({
      search: payload.search,
      role: payload.role,
      pagination,
    })

    return inertia.render('auth/admin/index', {
      users: UserTransformer.paginate(users.all(), users.getMeta()),
      roles: RoleTransformer.transform(roles),
      filters: payload,
      translations: buildUsersListPayload(this.i18n, roles),
    })
  }

  async destroy(ctx: HttpContext) {
    const { response, params, session } = ctx

    const payload = await deleteValidator.validate(params)

    await this.deleteUserAction.execute({ id: payload.id })

    session.flash('success', this.i18n.translate('admin.users.deleted'))

    return response.redirect().toRoute('admin.users.render')
  }
}
