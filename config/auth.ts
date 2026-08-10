import env from '#start/env'
import { defineConfig } from '@adonisjs/auth'
import { sessionGuard, sessionUserProvider } from '@adonisjs/auth/session'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

/**
 * Guard activation flags, driven by env so each flavor keeps exactly one
 * authentication model to reason about:
 *
 * - `full` / `inertia`: session guard on, token guard opt-in
 *   (`AUTH_GUARD_API=true`) when the project exposes the REST API (e.g. for
 *   a companion mobile app).
 * - `api`: `AUTH_GUARD_WEB=false` + `AUTH_GUARD_API=true` — the session
 *   guard is entirely absent from the runtime config.
 *
 * Route modules check these flags before registering routes that reference
 * a guard (see `start/routes.ts`).
 */
export const enabledAuthGuards = {
  web: env.get('AUTH_GUARD_WEB') ?? true,
  api: env.get('AUTH_GUARD_API') ?? false,
} as const

if (!enabledAuthGuards.web && !enabledAuthGuards.api) {
  throw new Error('At least one auth guard must be enabled (AUTH_GUARD_WEB / AUTH_GUARD_API)')
}

const guards = {
  /**
   * Session-based guard for browser authentication.
   */
  web: sessionGuard({
    /**
     * Enable persistent login using remember-me tokens.
     */
    useRememberMeTokens: true,

    provider: sessionUserProvider({
      model: () => import('#models/auth/user'),
    }),
  }),

  /**
   * Opaque access-token guard for REST API authentication. Tokens are
   * created explicitly (login endpoint, OAuth API mode); the guard only
   * verifies the `Authorization: Bearer` header.
   */
  api: tokensGuard({
    provider: tokensUserProvider({
      model: () => import('#models/auth/user'),
      tokens: 'accessTokens',
    }),
  }),
}

const authConfig = defineConfig({
  /**
   * Default guard used when no guard is explicitly specified.
   */
  default: enabledAuthGuards.web ? 'web' : 'api',

  /**
   * Disabled guards are filtered out of the runtime config. The static type
   * keeps both guards so `auth.use('api')` keeps typechecking in flavors
   * where the token guard is enabled; route modules referencing a disabled
   * guard are never registered, so the mismatch is unreachable.
   */
  guards: Object.fromEntries(
    Object.entries(guards).filter(([name]) => enabledAuthGuards[name as keyof typeof guards])
  ) as typeof guards,
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
