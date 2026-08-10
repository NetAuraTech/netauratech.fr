import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { ListUsersAction } from '#actions/user/list_users_action'
import { ListAllRolesAction } from '#actions/role/list_all_roles_action'
import { listValidator } from '#validators/user'
import UserTransformer from '#transformers/user_transformer'
import { roleIdsToAllowlist } from '#helpers/auth/load_user_role'
import { extractPagination } from '#helpers/pagination/extract_pagination'
import { stripEmptyStrings } from '#helpers/core/strip_empty_strings'

/**
 * GET /api/v1/admin/users — list users of the admin REST API.
 *
 * Thin transport wrapper around the shared {@link ListUsersAction}: validates
 * the query string, delegates pagination + filters, and serializes the
 * paginated result through the shared {@link UserTransformer}.
 */
@inject()
export default class UsersApiController {
  constructor(
    protected listUsersAction: ListUsersAction,
    protected listAllRolesAction: ListAllRolesAction
  ) {}

  /**
   * List users with search/role filters and pagination.
   */
  async index(ctx: HttpContext) {
    const { request, serialize } = ctx

    const pagination = await extractPagination(request)

    const roles = await this.listAllRolesAction.execute()
    const allowed = roleIdsToAllowlist(roles)

    const data = stripEmptyStrings(request.all())
    const payload = await listValidator(allowed).validate(data)

    const users = await this.listUsersAction.execute({
      search: payload.search,
      role: payload.role,
      pagination,
    })

    const serialized = await serialize(UserTransformer.paginate(users.all(), users.getMeta()))

    return ctx.response.ok(serialized)
  }
}
