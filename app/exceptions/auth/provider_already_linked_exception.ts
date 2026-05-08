import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class ProviderAlreadyLinkedException extends Exception {
  static status = 409
  static code = 'E_PROVIDER_ALREADY_LINKED'

  constructor(private provider: string) {
    super(`The "${provider}" account is already linked to another user.`, {
      status: ProviderAlreadyLinkedException.status,
      code: ProviderAlreadyLinkedException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`, { provider: error.provider })

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          details: {
            provider: error.provider,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
