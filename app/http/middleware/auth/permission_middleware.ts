import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UnauthorizedException from '#exceptions/auth/unauthorized_exception'
import ForbiddenException from '#exceptions/auth/forbidden_exception'

export default class PermissionMiddleware {
  async handle(ctx: HttpContext, next: NextFn, options: { permissions?: string[] }) {
    const { auth } = ctx

    const user = auth.user

    if (!user) {
      throw new UnauthorizedException()
    }

    const permissions = options.permissions || []

    if (permissions.length === 0) {
      return next()
    }

    const hasPermission = await Promise.all(permissions.map((permission) => user.can(permission)))

    if (!hasPermission.some(Boolean)) {
      throw new ForbiddenException()
    }

    await next()
  }
}
