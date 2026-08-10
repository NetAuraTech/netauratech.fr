import type { HttpContext } from '@adonisjs/core/http'
import { CreateUserAction } from '#actions/user/create_user_action'
import { inject } from '@adonisjs/core'
import { createValidator } from '#validators/user'
import { I18nService } from '#services/i18n_service'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import RoleTransformer from '#transformers/role_transformer'
import { buildUsersFormPayload } from '#helpers/i18n_payloads/users_form'

@inject()
export default class UsersCreateController {
  constructor(
    protected i18n: I18nService,
    protected createUserAction: CreateUserAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    const roles = await this.listAllRolesAction.execute()

    return inertia.render('auth/admin/form', {
      roles: RoleTransformer.transform(roles),
      translations: buildUsersFormPayload(this.i18n, roles),
    })
  }

  async execute(ctx: HttpContext) {
    const { request, response, session } = ctx

    const roles = await this.listAllRolesAction.execute()
    const allowed = roles.map((role) => String(role.id))

    const payload = await createValidator(allowed).validate(request.all())

    const user = await this.createUserAction.execute({
      email: payload.email,
      roleId: payload.role_id ? Number(payload.role_id) : undefined,
    })

    session.flash(
      'success',
      this.i18n.translate('admin.users.created', { email: user.email, username: user.username })
    )

    return response.redirect().toRoute('admin.users_show.render', { id: user.id })
  }
}
