import { type HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'

/**
 * Regenerates the CSRF token by rotating the current session after any
 * sensitive action that changes the user's authentication state.
 *
 * Failing to rotate the session after such actions leaves the application
 * vulnerable to CSRF fixation attacks, where an attacker who obtained a
 * valid token before the action could still use it afterward.
 *
 * Should be called after:
 * - Login
 * - Password change
 * - Email change
 * - Account deletion (before logout)
 * - OAuth provider linking / unlinking
 *
 * Errors during regeneration are caught and logged rather than thrown, so
 * that a failure here never interrupts the response flow.
 *
 * @param ctx - The current AdonisJS HTTP context.
 *
 * @example
 * await authService.login(email, password)
 * regenerateCsrfToken(ctx)
 * return response.redirect().toRoute('dashboard')
 */
export function regenerateCsrfToken(ctx: HttpContext): void {
  try {
    ctx.session.regenerate()

    logger.info('CSRF token regenerated', {
      userId: ctx.auth.user?.id,
      ip: ctx.request.ip(),
    })
  } catch (error) {
    logger.error('Failed to regenerate CSRF token', { error })
  }
}
