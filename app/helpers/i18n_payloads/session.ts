import type { I18nService } from '#services/i18n_service'

export function buildSessionPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'auth.session.login.title',
    sub_title: 'auth.session.login.sub_title',
    account: {
      no: 'auth.session.login.account.no',
      create: 'auth.session.login.account.create',
    },
    email: {
      value: 'auth.session.login.email.value',
      placeholder: 'auth.session.login.email.placeholder',
    },
    password: {
      value: 'auth.session.login.password.value',
      forgot: 'auth.session.login.password.forgot',
    },
    remember_me: 'auth.session.login.remember_me',
    submit: 'auth.session.login.submit',
    or_continue_with: 'auth.session.login.or_continue_with',
  })
}
