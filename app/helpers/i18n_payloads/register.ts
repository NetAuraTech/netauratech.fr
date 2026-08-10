import type { I18nService } from '#services/i18n_service'

export function buildRegisterPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'auth.register.title',
    sub_title: 'auth.register.sub_title',
    account: {
      has: 'auth.register.account.has',
      login: 'auth.register.account.login',
    },
    email: {
      value: 'auth.register.email.value',
      placeholder: 'auth.register.email.placeholder',
    },
    password: {
      value: 'auth.register.password.value',
      help: 'auth.register.password.help',
      confirmation: {
        value: 'auth.register.password.confirmation.value',
        help: 'auth.register.password.confirmation.help',
      },
    },
    submit: 'auth.register.submit',
    or_continue_with: 'auth.register.or_continue_with',
  })
}
