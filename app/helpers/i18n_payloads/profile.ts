import type { I18nService } from '#services/i18n_service'

export function buildProfilePayload(i18n: I18nService) {
  return i18n.buildPayload({
    header: {
      title: 'settings.title',
      sub_title: 'settings.sub_title',
      tabs: {
        profile: 'settings.profile.value',
        account: 'settings.account.value',
        preferences: 'settings.preferences.value',
        admin: 'admin.value',
        logout: 'auth.session.logout.value',
      },
    },
    avatar: {
      change: 'settings.profile.avatar.change',
      value: 'settings.profile.avatar.value',
    },
    username: {
      placeholder: 'settings.profile.username.placeholder',
      value: 'settings.profile.username.value',
    },
    title: 'settings.profile.title',
    sub_title: 'settings.profile.sub_title',
    submit: 'settings.profile.submit',
  })
}
