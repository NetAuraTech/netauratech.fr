import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UnauthorizedException from '#exceptions/auth/unauthorized_exception'
import ForbiddenException from '#exceptions/auth/forbidden_exception'

export default class RoleMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { roles?: string[] }) {
    const { auth } = ctx

    const user = auth.user

    if (!user) {
      throw new UnauthorizedException()
    }

    const roles = options.roles || []

    if (roles.length === 0) {
      return next()
    }

    const hasRole = await user.hasAnyRole(roles)

    if (!hasRole) {
      throw new ForbiddenException()
    }

    await next()
  }
}
