import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import { loginValidator } from '#validators/auth'
import { LoginAction } from '#actions/auth/login_action'
import { CreateApiTokenAction } from '#actions/auth/create_api_token_action'
import { RevokeApiTokenAction } from '#actions/auth/revoke_api_token_action'

/**
 * Token endpoints of the REST API (`/api/v1/auth`), guarded by the `api`
 * access-token guard — the session guard never sees these requests.
 */
@inject()
export default class TokenController {
  constructor(
    protected loginAction: LoginAction,
    protected createApiTokenAction: CreateApiTokenAction,
    protected revokeApiTokenAction: RevokeApiTokenAction
  ) {}

  /**
   * POST /api/v1/auth/login
   *
   * Verifies email/password credentials and issues an opaque access token.
   * The plain-text token is returned once; clients send it back as an
   * `Authorization: Bearer` header.
   */
  async execute(ctx: HttpContext) {
    const { request } = ctx

    const payload = await loginValidator.validate(request.all())

    const user = await this.loginAction.execute({
      email: payload.email,
      password: payload.password,
    })

    const { token, expiresAt } = await this.createApiTokenAction.execute({ user })

    return ctx.serialize({ token, expiresAt })
  }

  /**
   * POST /api/v1/auth/logout
   *
   * Revokes the access token presented on the request. Other tokens of the
   * same user keep working.
   */
  async destroy(ctx: HttpContext) {
    const { auth, response } = ctx

    const user = auth.use('api').getUserOrFail()
    await this.revokeApiTokenAction.execute({
      user,
      tokenIdentifier: user.currentAccessToken.identifier,
    })

    return response.noContent()
  }
}
