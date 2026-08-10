import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  deleteAccountValidator,
  updateEmailValidator,
  updatePasswordValidator,
} from '#validators/account'
import UserTransformer from '#transformers/user_transformer'
import { preloadUserRoleWithPermissions } from '#helpers/auth/load_user_role'
import { UpdateUserAccountAction } from '#actions/account/update_user_account_action'
import { DeleteUserAccountAction } from '#actions/account/delete_user_account_action'

/**
 * PUT    /api/v1/account — update own email or password
 * DELETE /api/v1/account — delete own account
 */
@inject()
export default class AccountApiController {
  constructor(
    protected updateUserAccountAction: UpdateUserAccountAction,
    protected deleteUserAccountAction: DeleteUserAccountAction
  ) {}

  async update(ctx: HttpContext) {
    const { auth, request, serialize, response } = ctx

    const action = request.input('_action')

    const user = auth.getUserOrFail()

    switch (action) {
      case 'update_email': {
        const payload = await updateEmailValidator(user.id).validate(request.all())

        await this.updateUserAccountAction.execute({ user, email: payload.email })

        await user.refresh()
        await preloadUserRoleWithPermissions(user)

        return serialize(UserTransformer.transform(user))
      }
      case 'update_password': {
        const payload = await updatePasswordValidator.validate(request.all())

        await this.updateUserAccountAction.execute({
          user,
          currentPassword: payload.current_password,
          password: payload.password,
        })

        await user.refresh()
        await preloadUserRoleWithPermissions(user)

        return serialize(UserTransformer.transform(user))
      }
      default: {
        return response.badRequest({
          error: {
            code: 'E_INVALID_ACTION',
            message: 'Unknown account action (_action must be "update_email" or "update_password")',
          },
        })
      }
    }
  }

  async destroy(ctx: HttpContext) {
    const { auth, request, response } = ctx

    const user = auth.getUserOrFail()

    const payload = await deleteAccountValidator.validate(request.all())

    await this.deleteUserAccountAction.execute({ user, password: payload.password })

    return response.noContent()
  }
}
