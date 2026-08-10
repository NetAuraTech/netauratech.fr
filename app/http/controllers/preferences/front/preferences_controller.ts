import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { updateValidator } from '#validators/preference'
import { I18nService } from '#services/i18n_service'
import { buildPreferencesPayload } from '#helpers/i18n_payloads/preferences'
import { UpdatePreferencesAction } from '#actions/preferences/update_preferences_action'

@inject()
export default class PreferencesController {
  constructor(
    protected i18n: I18nService,
    private updatePreferencesAction: UpdatePreferencesAction
  ) {}

  async render(ctx: HttpContext) {
    const { inertia } = ctx

    return inertia.render('settings/preferences/front/index', {
      translations: buildPreferencesPayload(this.i18n),
    })
  }

  async execute(ctx: HttpContext): Promise<void> {
    const { request, response, auth, session } = ctx

    const user = auth.getUserOrFail()
    const payload = await updateValidator.validate(request.all())

    await this.updatePreferencesAction.execute({ user, data: payload })

    await user.refresh()

    session.flash('success', this.i18n.translate('settings.preferences.success'))

    return response.redirect().toRoute('settings.preferences.render')
  }
}
