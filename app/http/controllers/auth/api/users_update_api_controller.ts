import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { GetUserDetailAction } from '#actions/user/get_user_detail_action'
import { UpdateUserAction } from '#actions/user/update_user_action'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import { restIdValidator, updateValidator } from '#validators/user'
import UserTransformer from '#transformers/user_transformer'
import { roleIdsToAllowlist } from '#helpers/auth/load_user_role'

/**
 * PUT /api/v1/admin/users/:id — update a user from the admin REST API.
 *
 * Thin transport wrapper around the shared {@link UpdateUserAction}. An email
 * change triggers the pending-email confirmation flow inside the action; the
 * user is then reloaded through {@link GetUserDetailAction} so the response
 * reflects the persisted state with role and permissions preloaded.
 */
@inject()
export default class UsersUpdateApiController {
  constructor(
    protected updateUserAction: UpdateUserAction,
    protected getUserDetailAction: GetUserDetailAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  async update(ctx: HttpContext) {
    const { params, request, response, serialize } = ctx

    const { id } = await restIdValidator.validate(params)

    const roles = await this.listAllRolesAction.execute()
    const allowed = roleIdsToAllowlist(roles)

    const payload = await updateValidator(id, allowed).validate(request.all())

    await this.updateUserAction.execute({
      id,
      email: payload.email,
      username: payload.username,
      roleId: payload.role_id ? Number(payload.role_id) : undefined,
    })

    const user = await this.getUserDetailAction.execute({ id })

    const serialized = await serialize(UserTransformer.transform(user))

    return response.ok(serialized)
  }
}
