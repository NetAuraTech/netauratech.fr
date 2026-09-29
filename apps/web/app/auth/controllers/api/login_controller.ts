import { inject } from '@adonisjs/core';
import { type HttpContext } from '@adonisjs/core/http';
import { LoginAction } from '#auth/actions/session/login_action';
import { CreateApiTokenAction } from '#auth/actions/token/create_api_token_action';
import { loginValidator } from '#transport/auth/validators/auth';

/**
 * Login endpoint of the REST API (`/api/v1/auth`), guarded by the `api`
 * access-token guard — the session guard never sees these requests.
 */
@inject()
export default class LoginController {
	constructor(
		protected loginAction: LoginAction,
		protected createApiTokenAction: CreateApiTokenAction,
	) {}

	/**
	 * POST /api/v1/auth/login
	 *
	 * Verifies email/password credentials and issues an opaque access token.
	 * The plain-text token is returned once; clients send it back as an
	 * `Authorization: Bearer` header.
	 */
	async execute(ctx: HttpContext) {
		const { request } = ctx;

		const payload = await loginValidator.validate(request.all());

		const user = await this.loginAction.execute({
			email: payload.email,
			password: payload.password,
		});

		const { token, expiresAt } = await this.createApiTokenAction.execute({ user });

		return ctx.serialize({ token, expiresAt });
	}
}
