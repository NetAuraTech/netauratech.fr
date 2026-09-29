import ForbiddenException from '#auth/exceptions/forbidden_exception';
import UnauthorizedException from '#auth/exceptions/unauthorized_exception';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

export default class RoleMiddleware {
	async handle(ctx: HttpContext, next: NextFn, options: { roles?: string[] }) {
		const { auth } = ctx;

		const user = auth.user;

		if (!user) {
			throw new UnauthorizedException();
		}

		const roles = options.roles || [];

		if (roles.length === 0) {
			return next();
		}

		const hasRole = await user.hasAnyRole(roles);

		if (!hasRole) {
			throw new ForbiddenException();
		}

		await next();
	}
}
