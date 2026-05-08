import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class InvalidCurrentPasswordException extends Exception {
  static status = 400
  static code = 'E_INVALID_CURRENT_PASSWORD'

  constructor() {
    super('The current password is incorrect.', {
      status: InvalidCurrentPasswordException.status,
      code: InvalidCurrentPasswordException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`)

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
