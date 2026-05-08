import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class InvalidExtensionException extends Exception {
  static status = 422
  static code = 'E_INVALID_EXTENSION'

  constructor(private ext: string) {
    super(`Extension ".${ext}" is not allowed.`, {
      status: InvalidExtensionException.status,
      code: InvalidExtensionException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`, {
      ext: error.ext,
    })

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          details: {
            ext: error.ext,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
