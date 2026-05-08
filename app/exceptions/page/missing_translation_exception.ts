import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class MissingTranslationException extends Exception {
  static status = 404
  static code = 'E_MISSING_TRANSLATION'

  constructor(
    private locale: string,
    private pageId: number
  ) {
    super(`No translation for locale "${locale}" on page ${pageId}`, {
      status: MissingTranslationException.status,
      code: MissingTranslationException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`, {
      locale: error.locale,
      pageId: error.pageId,
    })

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          details: {
            locale: error.locale,
            pageId: error.pageId,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
