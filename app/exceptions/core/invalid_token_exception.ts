import { BaseHttpException } from '#exceptions/base_http_exception'
import type { HttpContext } from '@adonisjs/core/http'
import { routePath } from '#helpers/router/route_path'

export default class InvalidTokenException extends BaseHttpException {
  static status = 400
  static code = 'E_INVALID_TOKEN'

  constructor() {
    super('This link is invalid or has expired. Please request a new one.')
  }

  protected redirectPath(response: HttpContext['response']): ReturnType<typeof response.redirect> {
    const loginPath = routePath('auth.session.render')
    if (loginPath) return response.redirect().toPath(loginPath)
    return response.redirect().back()
  }
}
