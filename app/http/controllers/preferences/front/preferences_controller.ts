import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import { updateValidator } from '#validators/preference'
import PreferencesService from '#services/preferences/preference_service'

@inject()
export default class PreferencesController {
  constructor(private preferencesService: PreferencesService) {}

  async render(ctx: HttpContext) {
    const { inertia, i18n } = ctx

    return inertia.render('settings/preferences/front/index', {
      translations: {
        header: {
          title: i18n.t('settings.title'),
          sub_title: i18n.t('settings.sub_title'),
          tabs: {
            profile: i18n.t('settings.profile.value'),
            account: i18n.t('settings.account.value'),
            preferences: i18n.t('settings.preferences.value'),
            admin: i18n.t('cms.value'),
            logout: i18n.t('auth.session.logout.value'),
          },
        },
        appearance: {
          title: i18n.t('settings.preferences.appearance.title'),
          sub_title: i18n.t('settings.preferences.appearance.sub_title'),
          value: i18n.t('settings.preferences.appearance.value'),
        },
        interface: {
          title: i18n.t('settings.preferences.interface.title'),
          sub_title: i18n.t('settings.preferences.interface.sub_title'),
          submit: i18n.t('settings.preferences.interface.submit'),
          locale: {
            english: i18n.t('settings.preferences.interface.locale.english'),
            french: i18n.t('settings.preferences.interface.locale.french'),
            value: i18n.t('settings.preferences.interface.locale.value'),
          },
        },
      },
    })
  }

  async execute(ctx: HttpContext): Promise<void> {
    const { request, response, auth, session, i18n } = ctx

    const user = auth.getUserOrFail()
    const payload = await updateValidator.validate(request.all())

    await this.preferencesService.update(user, payload)

    await user.refresh()

    session.flash('success', i18n.t('settings.preferences.success'))

    return response.redirect().toRoute('settings.preferences.render')
  }
}
