import type { I18nService } from '#services/i18n_service'

export function buildForgotPasswordPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'auth.password.forgot.title',
    sub_title: 'auth.password.forgot.sub_title',
    email: {
      value: 'auth.password.forgot.email.value',
      placeholder: 'auth.password.forgot.email.placeholder',
    },
    submit: 'auth.password.forgot.submit',
    back_to_login: 'auth.password.forgot.back_to_login',
  })
}
