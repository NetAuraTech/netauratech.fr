import type { I18nService } from '#services/i18n_service'

export function buildPreferencesPayload(i18n: I18nService) {
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
    appearance: {
      title: 'settings.preferences.appearance.title',
      sub_title: 'settings.preferences.appearance.sub_title',
      value: 'settings.preferences.appearance.value',
    },
    interface: {
      title: 'settings.preferences.interface.title',
      sub_title: 'settings.preferences.interface.sub_title',
      submit: 'settings.preferences.interface.submit',
      locale: {
        english: 'settings.preferences.interface.locale.english',
        french: 'settings.preferences.interface.locale.french',
        value: 'settings.preferences.interface.locale.value',
      },
    },
  })
}
