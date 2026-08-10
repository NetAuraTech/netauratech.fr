import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import {
  deleteAccountValidator,
  updateEmailValidator,
  updatePasswordValidator,
} from '#validators/account'
import { Exception } from '@adonisjs/core/exceptions'
import { regenerateCsrfToken } from '#helpers/auth/crsf'
import { I18nService } from '#services/i18n_service'
import { buildAccountPayload } from '#helpers/i18n_payloads/account'
import { enabledProviders } from '#helpers/auth/oauth'
import UserTransformer from '#transformers/user_transformer'
import { UpdateUserAccountAction } from '#actions/account/update_user_account_action'
import { DeleteUserAccountAction } from '#actions/account/delete_user_account_action'

@inject()
export default class AccountController {
  constructor(
    protected i18n: I18nService,
    protected updateUserAccountAction: UpdateUserAccountAction,
    protected deleteUserAccountAction: DeleteUserAccountAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, auth } = ctx

    const user = auth.user!

    return inertia.render('settings/account/front/index', {
      user: UserTransformer.transform(user),
      providers: enabledProviders,
      translations: buildAccountPayload(this.i18n),
    })
  }

  async execute(ctx: HttpContext) {
    const { auth, request, response, session } = ctx

    const action = request.input('_action')

    const user = auth.getUserOrFail()

    console.log('AccountController.execute action:', action)

    switch (action) {
      case 'update_email': {
        const payload = await updateEmailValidator(user.id).validate(request.all())

        console.log('update_email payload:', payload)

        const updated = await this.updateUserAccountAction.execute({ user, email: payload.email })

        console.log('updated user pendingEmail:', updated.pendingEmail)

        regenerateCsrfToken(ctx)

        if (payload.email === updated.pendingEmail) {
          console.log('Setting flash success for email change')
          session.flash('success', this.i18n.translate('settings.account.success'))
        } else {
          console.log('NOT setting flash - email same as current')
        }

        return response.redirect().toRoute('settings.account.render')
      }
      case 'update_password': {
        const payload = await updatePasswordValidator.validate(request.all())

        await this.updateUserAccountAction.execute({
          user,
          currentPassword: payload.current_password,
          password: payload.password,
        })

        regenerateCsrfToken(ctx)

        session.flash('success', this.i18n.translate('settings.account.password.success'))

        return response.redirect().toRoute('settings.account.render')
      }
      default:
        throw new Exception('', { status: 400 })
    }
  }

  async destroy(ctx: HttpContext) {
    const { auth, request, response, session } = ctx

    const user = auth.getUserOrFail()

    const payload = await deleteAccountValidator.validate(request.all())

    await this.deleteUserAccountAction.execute({ user, password: payload.password })

    await auth.use('web').logout()

    session.flash('success', this.i18n.translate('settings.password.delete.success'))

    return response.redirect().toRoute('auth.session.render')
  }
}
