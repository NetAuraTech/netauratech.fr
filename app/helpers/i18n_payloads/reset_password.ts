import type { I18nService } from '#services/i18n_service'

export function buildResetPasswordPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'auth.password.reset.title',
    sub_title: 'auth.password.reset.sub_title',
    password: {
      value: 'auth.password.reset.password.value',
      help: 'auth.password.reset.password.help',
      confirmation: {
        value: 'auth.password.reset.password.confirmation.value',
        help: 'auth.password.reset.password.confirmation.help',
      },
    },
    submit: 'auth.password.reset.submit',
    back_to_login: 'auth.password.reset.back_to_login',
  })
}
