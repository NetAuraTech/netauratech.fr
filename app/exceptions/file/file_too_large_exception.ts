import { Exception } from '@adonisjs/core/exceptions'
import env from '#start/env'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class FileTooLargeException extends Exception {
  static status = 413
  static code = 'E_FILE_TOO_LARGE'

  constructor(private limit: number = env.get('MAX_UPLOAD_SIZE', 10)) {
    super(`File exceeds the ${limit}MB limit.`, {
      status: FileTooLargeException.status,
      code: FileTooLargeException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`, {
      limit: error.limit,
    })

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          details: {
            limit: error.limit,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
