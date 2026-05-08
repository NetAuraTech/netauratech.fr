import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class UnverifiedAccountException extends Exception {
  static status = 403
  static code = 'E_UNVERIFIED_ACCOUNT'

  constructor(private email: string) {
    super(
      'This account has not yet been verified. Please verify your email address before continuing.',
      {
        status: UnverifiedAccountException.status,
        code: UnverifiedAccountException.code,
      }
    )
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
