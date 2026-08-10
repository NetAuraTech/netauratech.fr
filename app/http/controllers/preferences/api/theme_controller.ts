import type { HttpContext } from '@adonisjs/core/http'
import { updateValidator } from '#validators/preference'
import { inject } from '@adonisjs/core'
import { I18nService } from '#services/i18n_service'
import { UpdatePreferencesAction } from '#actions/preferences/update_preferences_action'

@inject()
export default class ThemesController {
  constructor(
    protected i18n: I18nService,
    private updatePreferencesAction: UpdatePreferencesAction
  ) {}

  async execute(ctx: HttpContext) {
    const { request, response, auth, session } = ctx

    const user = auth.getUserOrFail()
    const payload = await updateValidator.validate(request.all())

    await this.updatePreferencesAction.execute({ user, data: payload })

    await user.refresh()

    session.flash('success', this.i18n.translate('settings.preferences.success'))

    return response.ok(this.i18n.translate('settings.preferences.theme.success'))
  }
}
