import type { I18nService } from '#services/i18n_service'

export function buildSocialDefinePasswordPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'auth.password.define.title',
    sub_title: 'auth.password.define.sub_title',
    password: {
      value: 'auth.password.define.password.value',
      help: 'auth.password.define.password.help',
      confirmation: {
        value: 'auth.password.define.password.confirmation.value',
        help: 'auth.password.define.password.confirmation.help',
      },
    },
    submit: 'auth.password.define.submit',
  })
}
