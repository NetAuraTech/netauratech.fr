import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class EmailAlreadyExistsException extends Exception {
  static status = 409
  static code = 'E_EMAIL_EXISTS'

  constructor(private email: string) {
    super('This email address is already in use by another account.', {
      status: EmailAlreadyExistsException.status,
      code: EmailAlreadyExistsException.code,
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
          details: {
            email: error.email,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
