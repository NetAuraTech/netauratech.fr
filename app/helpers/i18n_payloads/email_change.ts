import type { I18nService } from '#services/i18n_service'

export function buildEmailChangePayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'settings.email.change.title',
    sub_title: 'settings.email.change.sub_title',
    submit: 'settings.email.change.submit',
    cancel: 'settings.email.change.cancel',
    token: 'settings.email.change.token',
    info: {
      title: 'settings.email.change.info.title',
      message: 'settings.email.change.info.message',
    },
  })
}
