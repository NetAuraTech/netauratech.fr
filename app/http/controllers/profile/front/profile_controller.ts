import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import UserTransformer from '#transformers/user_transformer'
import { profileValidator } from '#validators/profile'
import { ProfileService } from '#services/profile/profile_service'

@inject()
export default class ProfileController {
  constructor(protected profileService: ProfileService) {}

  async render(ctx: HttpContext) {
    const { inertia, auth, i18n } = ctx

    const user = auth.user!

    return inertia.render('settings/profile/front/index', {
      user: UserTransformer.transform(user),
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
        avatar: {
          change: i18n.t('settings.profile.avatar.change'),
          value: i18n.t('settings.profile.avatar.value'),
        },
        username: {
          placeholder: i18n.t('settings.profile.username.placeholder'),
          value: i18n.t('settings.profile.username.value'),
        },
        title: i18n.t('settings.profile.title'),
        sub_title: i18n.t('settings.profile.sub_title'),
        submit: i18n.t('settings.profile.submit'),
      },
    })
  }

  async execute(ctx: HttpContext) {
    const { auth, request, response, session, i18n } = ctx

    const user = auth.getUserOrFail()

    const payload = await profileValidator(user.id).validate(request.all())

    await this.profileService.update(user, payload)

    await user.refresh()

    session.flash('success', i18n.t('settings.profile.success'))

    return response.redirect().toRoute('settings.profile.render')
  }
}
