import { routePath } from '#core/services/route_path';
import type { Authenticators } from '@adonisjs/auth/types';
import type { HttpContext } from '@adonisjs/core/http';
import type { NextFn } from '@adonisjs/core/types/http';

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
	/**
	 * The URL to redirect to, when authentication fails. Only meaningful when
	 * a session login page is registered (`full`/`inertia` flavors); the
	 * headless `api` flavor leaves it unset and token failures surface as
	 * JSON 401s instead of a redirect.
	 */
	redirectTo = routePath('auth.session.render') ?? undefined;

	async handle(
		ctx: HttpContext,
		next: NextFn,
		options: {
			guards?: (keyof Authenticators)[];
		} = {},
	) {
		await ctx.auth.authenticateUsing(options.guards, { loginRoute: this.redirectTo });
		return next();
	}
}
