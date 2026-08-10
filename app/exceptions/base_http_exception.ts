import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'

export abstract class BaseHttpException extends Exception {
  static status: number = 500
  static code: string = 'E_UNKNOWN'

  constructor(message: string, cause?: unknown) {
    super(message, { cause })
  }

  /** Additional data included in the JSON error response. Override if needed. */
  protected details(): Record<string, unknown> | undefined {
    return undefined
  }

  /** Parameters passed to i18n.t() for string interpolation. Override if needed. */
  protected i18nParams(): Record<string, unknown> {
    return {}
  }

  /** Redirect behavior when not JSON. Override if needed. */
  protected redirectPath(response: HttpContext['response']): ReturnType<typeof response.redirect> {
    return response.redirect().back()
  }

  async handle(error: this, ctx: HttpContext): Promise<void> {
    const { request, response, session } = ctx

    const message = ctx.i18n.t(`exceptions.${error.code}`, error.i18nParams())

    if (request.wantsJSON()) {
      return response.status(error.status).send({
        error: {
          code: error.code,
          message,
          ...(this.details() && { details: this.details() }),
          ...(app.inDev && { stack: error.stack }),
        },
      })
    }

    session.flash('error', message)
    return this.redirectPath(response)
  }
}
