import { BaseHttpException } from '#core/exceptions/base_http_exception';
import { routePath } from '#core/services/route_path';
import type { HttpContext } from '@adonisjs/core/http';

export default class UnauthorizedException extends BaseHttpException {
	static status = 401;
	static code = 'E_UNAUTHORIZED';

	constructor() {
		super('You must be logged in to access this resource.');
	}

	protected redirectPath(response: HttpContext['response']) {
		const loginPath = routePath('auth.session.render');
		if (loginPath) return response.redirect().toPath(loginPath);
		return response.redirect().back();
	}
}
