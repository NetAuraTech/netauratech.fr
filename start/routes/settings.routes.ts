/*
|--------------------------------------------------------------------------
| Settings routes
|--------------------------------------------------------------------------
|
| Profile, account, preferences, and the settings redirect index.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

export function registerSettingsRoutes(): void {
  router
    .group(() => {
      router
        .group(() => {
          router.get('/', [controllers.profile.front.Profile, 'render'])
          router.post('/', [controllers.profile.front.Profile, 'execute'])
        })
        .prefix('profile')
        .use([middleware.auth({ guards: ['web'] })])

      router
        .group(() => {
          router
            .group(() => {
              router.get('/', [controllers.account.front.Account, 'render'])
              router.post('/', [controllers.account.front.Account, 'execute'])
              router.delete('/', [controllers.account.front.Account, 'destroy'])
            })
            .use([middleware.auth({ guards: ['web'] })])

          router
            .group(() => {
              router.get('/:token', [controllers.account.front.EmailChange, 'render'])
              router.post('/', [controllers.account.front.EmailChange, 'execute'])
            })
            .prefix('email_change')
        })
        .prefix('account')

      router
        .group(() => {
          router.get('/', [controllers.preferences.front.Preferences, 'render'])
          router.post('/', [controllers.preferences.front.Preferences, 'execute'])
        })
        .prefix('preferences')
        .use([middleware.auth({ guards: ['web'] })])

      router
        .get('/', function (ctx) {
          const { response } = ctx

          return response.redirect().toRoute('settings.profile.render')
        })
        .as('index')
        .use([middleware.auth({ guards: ['web'] })])
    })
    .prefix('settings')
    .as('settings')
}
