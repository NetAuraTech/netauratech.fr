import type { HttpContext } from '@adonisjs/core/http'
import { GetUserDetailAction } from '#actions/user/get_user_detail_action'
import { UpdateUserAction } from '#actions/user/update_user_action'
import { inject } from '@adonisjs/core'
import { editValidator, updateValidator } from '#validators/user'
import { I18nService } from '#services/i18n_service'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import UserTransformer from '#transformers/user_transformer'
import RoleTransformer from '#transformers/role_transformer'
import { buildUsersFormPayload } from '#helpers/i18n_payloads/users_form'

@inject()
export default class UsersUpdateController {
  constructor(
    protected i18n: I18nService,
    protected getUserDetailAction: GetUserDetailAction,
    protected updateUserAction: UpdateUserAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    const payload = await editValidator.validate(params)

    const user = await this.getUserDetailAction.execute({ id: payload.id })

    const roles = await this.listAllRolesAction.execute()

    return inertia.render('auth/admin/form', {
      user: UserTransformer.transform(user),
      roles: RoleTransformer.transform(roles),
      translations: buildUsersFormPayload(this.i18n, roles),
    })
  }

  async execute(ctx: HttpContext) {
    const { params, request, response, session } = ctx

    const { id } = await editValidator.validate(params)

    const roles = await this.listAllRolesAction.execute()
    const allowed = roles.map((role) => String(role.id))

    const payload = await updateValidator(id, allowed).validate(request.all())

    const updated = await this.updateUserAction.execute({
      id,
      email: payload.email,
      username: payload.username,
      roleId: payload.role_id ? Number(payload.role_id) : undefined,
    })

    let flash = this.i18n.translate('admin.users.updated')

    if (updated?.pendingEmail === payload.email) {
      flash = `${flash} ${this.i18n.translate('admin.users.updated_email')}`
    }

    session.flash('success', flash)

    return response.redirect().toRoute('admin.users_show.render', { id })
  }
}
