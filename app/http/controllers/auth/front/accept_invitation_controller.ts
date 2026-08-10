import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { acceptInvitationValidator, invitationValidator } from '#validators/auth'
import { I18nService } from '#services/i18n_service'
import { buildAcceptInvitationPayload } from '#helpers/i18n_payloads/accept_invitation'
import { FullToken } from '#types/core'
import UserTransformer from '#transformers/user_transformer'
import { GetInvitationAction } from '#actions/invitation/get_invitation_action'
import { AcceptInvitationAction } from '#actions/invitation/accept_invitation_action'

@inject()
export default class AcceptInvitationController {
  constructor(
    protected i18n: I18nService,
    protected getInvitationAction: GetInvitationAction,
    protected acceptInvitationAction: AcceptInvitationAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia, params } = ctx

    const payload = await invitationValidator.validate(params)
    const user = await this.getInvitationAction.execute({ token: payload.token as FullToken })

    return inertia.render('auth/front/accept_invitation', {
      token: payload.token,
      user: UserTransformer.transform(user),
      translations: buildAcceptInvitationPayload(this.i18n, user.email),
    })
  }

  async execute(ctx: HttpContext) {
    const { response, request, auth, session } = ctx

    const { token } = await invitationValidator.validate(request.only(['token']))

    const invitedUser = await this.getInvitationAction.execute({ token: token as FullToken })

    const payload = await acceptInvitationValidator(invitedUser.id).validate(request.all())

    const user = await this.acceptInvitationAction.execute({
      token: token as FullToken,
      password: payload.password,
    })

    await auth.use('web').login(user)

    session.flash('success', this.i18n.translate('auth.invitation.accepted'))

    return response.redirect().toRoute('settings.index')
  }
}
