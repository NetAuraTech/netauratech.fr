import type { HttpContext } from '@adonisjs/core/http'
import { updateValidator } from '#validators/preference'
import PreferencesService from '#services/preferences/preference_service'
import { inject } from '@adonisjs/core'

@inject()
export default class ThemesController {
  constructor(private preferencesService: PreferencesService) {}

  async execute(ctx: HttpContext) {
    const { request, response, auth, session, i18n } = ctx

    const user = auth.getUserOrFail()
    const payload = await updateValidator.validate(request.all())

    await this.preferencesService.update(user, payload)

    await user.refresh()

    session.flash('success', i18n.t('settings.preferences.success'))

    return response.ok(i18n.t('settings.preferences.theme.success'))
  }
}
