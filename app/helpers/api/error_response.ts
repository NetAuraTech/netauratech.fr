import type { HttpContext } from '@adonisjs/core/http'

/**
 * Render the canonical 404 JSON body for an invalid token on the REST API.
 *
 * The email-verification and accept-invitation endpoints map an invalid token
 * to 404 (rather than the exception's default 400) so a caller cannot tell a
 * well-formed-but-wrong token apart from a real one. The body follows the
 * `{ error: { code, message } }` shape from `docs/agents/exceptions.md`.
 */
export function invalidTokenNotFound(ctx: HttpContext) {
  return ctx.response.notFound({
    error: {
      code: 'E_INVALID_TOKEN',
      message: ctx.i18n.t('exceptions.E_INVALID_TOKEN'),
    },
  })
}
