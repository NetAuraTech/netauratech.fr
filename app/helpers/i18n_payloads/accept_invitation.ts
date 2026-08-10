import type { I18nService } from '#services/i18n_service'

export function buildAcceptInvitationPayload(i18n: I18nService, email: string) {
  return i18n.buildPayload({
    title: 'auth.invitation.title',
    sub_title: 'auth.invitation.sub_title',
    email: {
      value: 'auth.invitation.email.value',
      placeholder: 'auth.invitation.email.placeholder',
      help: 'auth.invitation.email.help',
    },
    username: {
      value: 'auth.invitation.username.value',
      placeholder: 'auth.invitation.username.placeholder',
      help: 'auth.invitation.username.help',
    },
    password: {
      confirmation: {
        help: 'auth.invitation.password.confirmation.help',
        value: 'auth.invitation.password.confirmation.value',
      },
      help: 'auth.invitation.password.help',
      value: 'auth.invitation.password.value',
    },
    banner: {
      title: i18n.entry('auth.invitation.banner.title', { email }),
      message: 'auth.invitation.banner.message',
    },
    submit: 'auth.invitation.submit',
  })
}
