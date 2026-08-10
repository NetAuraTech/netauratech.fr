import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { GetUserDetailAction } from '#actions/user/get_user_detail_action'
import { restIdValidator } from '#validators/user'
import UserTransformer from '#transformers/user_transformer'

/**
 * GET /api/v1/admin/users/:id — show a single user from the admin REST API.
 *
 * Thin transport wrapper around the shared {@link GetUserDetailAction}. Uses
 * the REST id validator (number-only, no `exists` lookup) so unknown ids
 * surface as a typed `RowNotFoundException` (HTTP 404) instead of a Vine
 * validation error (422).
 */
@inject()
export default class UsersShowApiController {
  constructor(protected getUserDetailAction: GetUserDetailAction) {}

  async show(ctx: HttpContext) {
    const { params, serialize } = ctx

    const { id } = await restIdValidator.validate(params)

    const user = await this.getUserDetailAction.execute({ id })

    const serialized = await serialize(UserTransformer.transform(user))

    return ctx.response.ok(serialized)
  }
}
