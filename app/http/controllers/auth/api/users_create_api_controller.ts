import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { CreateUserAction } from '#actions/user/create_user_action'
import { GetUserDetailAction } from '#actions/user/get_user_detail_action'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import { createValidator } from '#validators/user'
import UserTransformer from '#transformers/user_transformer'
import { roleIdsToAllowlist } from '#helpers/auth/load_user_role'

/**
 * POST /api/v1/admin/users — create a user from the admin REST API.
 *
 * Thin transport wrapper around the shared {@link CreateUserAction}. The
 * action does not preload the role, so the created user is reloaded through
 * {@link GetUserDetailAction} before serialization to satisfy the
 * {@link UserTransformer} contract.
 */
@inject()
export default class UsersCreateApiController {
  constructor(
    protected createUserAction: CreateUserAction,
    protected getUserDetailAction: GetUserDetailAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  async store(ctx: HttpContext) {
    const { request, response, serialize } = ctx

    const roles = await this.listAllRolesAction.execute()
    const allowed = roleIdsToAllowlist(roles)

    const payload = await createValidator(allowed).validate(request.all())

    const created = await this.createUserAction.execute({
      email: payload.email,
      roleId: payload.role_id ? Number(payload.role_id) : undefined,
    })

    const user = await this.getUserDetailAction.execute({ id: created.id })

    const serialized = await serialize(UserTransformer.transform(user))

    return response.created(serialized)
  }
}
