import { Exception } from '@adonisjs/core/exceptions'
import { type LucidModel } from '@adonisjs/lucid/types/model'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class RowNotFoundException extends Exception {
  static readonly status: number = 404
  static readonly code: string = 'E_ROW_NOT_FOUND'

  constructor(private model?: LucidModel) {
    super('The requested resource cannot be found.')
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
            model: error.model,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
