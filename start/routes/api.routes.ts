/*
|--------------------------------------------------------------------------
| REST API routes (token-guarded)
|--------------------------------------------------------------------------
|
| Versioned REST API for non-browser clients (mobile apps, scripts). These
| routes authenticate exclusively through the `api` access-token guard —
| session cookies are never consulted. Registered only when the guard is
| enabled (see `enabledAuthGuards` in `config/auth.ts`).
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import { throttle } from '#start/limiter'
import features from '#config/features'
import { enabledAuthGuards } from '#config/auth'

/**
 * Whether the identity/token REST surface is exposed at all. The whole
 * `/api/v1` surface is gated by the `adminApi` feature flag and additionally
 * requires the `api` access-token guard (session cookies are never consulted).
 */
export function identityApiEnabled(featuresList: { adminApi: boolean }): boolean {
  return featuresList.adminApi && enabledAuthGuards.api
}

export function registerApiRoutes(): void {
  if (!identityApiEnabled(features)) return

  router
    .group(() => {
      router
        .group(() => {
          // Same credential-stuffing budget as the session login.
          router.post('login', [controllers.auth.api.Token, 'execute']).use([throttle(5, 900)])

          router
            .post('register', [controllers.auth.api.RegisterApi, 'store'])
            .use([throttle(3, 3600)])
          router
            .post('forgot-password', [controllers.auth.api.ForgotPasswordApi, 'store'])
            .use([throttle(3, 3600)])
          router.post('reset-password', [controllers.auth.api.ResetPasswordApi, 'store'])
          router.post('verify-email/:token', [controllers.auth.api.EmailVerificationApi, 'store'])
          router.post('accept-invitation', [controllers.auth.api.AcceptInvitationApi, 'store'])

          router
            .group(() => {
              router.post('logout', [controllers.auth.api.Token, 'destroy'])
              router.get('me', [controllers.auth.api.Me, 'show'])
            })
            .use([middleware.auth({ guards: ['api'] })])
        })
        .prefix('auth')
        .as('auth')

      router
        .group(() => {
          router.get('/', [controllers.profile.api.ProfileApi, 'show'])
          router.put('/', [controllers.profile.api.ProfileApi, 'update'])
        })
        .prefix('profile')
        .as('profile')
        .use([middleware.auth({ guards: ['api'] })])

      router
        .group(() => {
          router.put('/', [controllers.account.api.AccountApi, 'update'])
          router.delete('/', [controllers.account.api.AccountApi, 'destroy'])
        })
        .prefix('account')
        .as('account')
        .use([middleware.auth({ guards: ['api'] })])
    })
    .prefix('api/v1')
    .as('api.v1')
}
