import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export default class SlugExistsException extends Exception {
  static status = 409
  static code = 'E_SLUG_EXISTS'

  constructor(private slug: string) {
    super(`Slug "${slug}" is already taken.`, {
      status: SlugExistsException.status,
      code: SlugExistsException.code,
    })
  }

  async handle(error: this, ctx: HttpContext) {
    const { request, response, session, i18n } = ctx

    const message = i18n.t(`exceptions.${error.code}`, {
      slug: error.slug,
    })

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message: message,
          details: {
            slug: error.slug,
          },
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return response.redirect().back()
  }
}
