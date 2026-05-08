/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'
import router from '@adonisjs/core/services/router'
import { throttle } from '#start/limiter'

router
  .group(() => {
    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.auth.front.Session, 'render'])
            router.post('/', [controllers.auth.front.Session, 'execute']).use([throttle(5, 900)])
          })
          .prefix('login')

        router
          .group(() => {
            router.get('/', [controllers.auth.front.Register, 'render'])
            router.post('/', [controllers.auth.front.Register, 'execute']).use([throttle(3, 3600)])
          })
          .prefix('register')

        router
          .group(() => {
            router.get('/', [controllers.auth.front.ForgotPassword, 'render'])
            router
              .post('/', [controllers.auth.front.ForgotPassword, 'execute'])
              .use([throttle(3, 3600)])
          })
          .prefix('forgot-password')

        router
          .group(() => {
            router.get('/:token', [controllers.auth.front.ResetPassword, 'render'])
            router
              .post('/', [controllers.auth.front.ResetPassword, 'execute'])
              .use([throttle(3, 900)])
          })
          .prefix('reset-password')

        router
          .group(() => {
            router.get('/:token', [controllers.auth.front.AcceptInvitation, 'render'])
            router
              .post('/', [controllers.auth.front.AcceptInvitation, 'execute'])
              .use([throttle(3, 900)])
          })
          .prefix('accept-invitation')
      })
      .use([middleware.guest()])

    router.group(() => {
      router
        .group(() => {
          router.post('/', [controllers.auth.front.Session, 'destroy'])
        })
        .prefix('logout')
    })

    router
      .get('/verify/:token', [controllers.auth.front.EmailVerification, 'execute'])
      .use([middleware.auth()])

    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.auth.front.Social, 'render'])
            router.post('/', [controllers.auth.front.Social, 'execute'])
          })
          .prefix('define-password')

        router.get('/:provider', [controllers.auth.front.Social, 'redirect'])
        router.get('/:provider/callback', [controllers.auth.front.Social, 'callback'])

        router.post('/:provider/unlink', [controllers.auth.front.Social, 'unlink'])
      })
      .prefix('oauth')
  })
  .as('auth')

router
  .group(() => {
    router
      .group(() => {
        router.get('/', [controllers.profile.front.Profile, 'render'])
        router.post('/', [controllers.profile.front.Profile, 'execute'])
      })
      .prefix('profile')
      .use([middleware.auth()])

    router
      .group(() => {
        router
          .group(() => {
            router.get('/', [controllers.account.front.Account, 'render'])
            router.post('/', [controllers.account.front.Account, 'execute'])
            router.delete('/', [controllers.account.front.Account, 'destroy'])
          })
          .use([middleware.auth()])

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
      .use([middleware.auth()])

    router
      .get('/', function (ctx) {
        const { response } = ctx

        return response.redirect().toRoute('settings.profile.render')
      })
      .as('index')
      .use([middleware.auth()])
  })
  .prefix('settings')
  .as('settings')

router
  .group(() => {
    router
      .get('/', [controllers.core.cms.Dashboard, 'render'])
      .use([middleware.permission({ permissions: ['admin.access'] })])

    router
      .group(() => {
        router
          .get('/', [controllers.auth.cms.Users, 'render'])
          .use([middleware.permission({ permissions: ['users.view'] })])

        router
          .group(() => {
            router.get('/', [controllers.auth.cms.UsersCreate, 'render'])
            router.post('/', [controllers.auth.cms.UsersCreate, 'execute'])
          })
          .prefix('create')
          .use([middleware.permission({ permissions: ['users.create'] })])

        router
          .group(() => {
            router
              .delete('/', [controllers.auth.cms.Users, 'destroy'])
              .use([middleware.permission({ permissions: ['users.delete'] })])
            router
              .get('/', [controllers.auth.cms.UsersShow, 'render'])
              .use([middleware.permission({ permissions: ['users.view'] })])

            router
              .group(() => {
                router.get('/', [controllers.auth.cms.UsersUpdate, 'render']).use([])
                router.post('/', [controllers.auth.cms.UsersUpdate, 'execute']).use([])
              })
              .prefix('edit')
              .use([middleware.permission({ permissions: ['users.update'] })])
          })
          .prefix(':id')
      })
      .prefix('users')

    router.group(() => {
      // Pages
      router
        .group(() => {
          router.get('/', [controllers.page.cms.Pages, 'render'])

          router
            .group(() => {
              router.get('/', [controllers.page.cms.PagesCreate, 'render'])
              router.post('/', [controllers.page.cms.PagesCreate, 'execute'])
            })
            .prefix('create')

          router
            .group(() => {
              router.get('/', [controllers.page.cms.PagesShow, 'render'])
              router.get('/edit', [controllers.page.cms.PagesUpdate, 'render'])
              router.post('/edit', [controllers.page.cms.PagesUpdate, 'execute'])
              router.post('/publish', [controllers.page.cms.PagesUpdate, 'publish'])
              router.post('/unpublish', [controllers.page.cms.PagesUpdate, 'unpublish'])
              router.post('/homepage', [controllers.page.cms.Pages, 'setHomepage'])
              router.delete('/', [controllers.page.cms.Pages, 'destroy'])
              router.post('/translations', [controllers.page.cms.PageTranslations, 'execute'])
              router
                .group(() => {
                  router.get('/', [controllers.page.cms.PageRevisions, 'index'])
                  router.post('/:revisionId/restore', [
                    controllers.page.cms.PageRevisions,
                    'restore',
                  ])
                  router.post('/:revisionId/keep', [
                    controllers.page.cms.PageRevisions,
                    'toggleKeep',
                  ])
                })
                .prefix('translations/:translationId/revisions')
            })
            .prefix(':id')

          router.get('/preview/:pageId', [controllers.page.cms.PagesPreview, 'render'])
        })
        .prefix('pages')

      // Templates
      router.get('/templates', [controllers.template.cms.Templates, 'render'])
      router.post('/templates', [controllers.template.cms.Templates, 'execute'])
      router.post('/templates/from-page', [controllers.template.cms.Templates, 'createFromPage'])
      router.post('/templates/:id/apply', [controllers.template.cms.Templates, 'applyToPage'])
      router.put('/templates/:id', [controllers.template.cms.Templates, 'update'])
      router.delete('/templates/:id', [controllers.template.cms.Templates, 'destroy'])

      // Files
      router.get('/files', [controllers.file.cms.Files, 'render'])
      router.post('/files/upload', [controllers.file.cms.Files, 'upload'])
      router.post('/files/:id/move', [controllers.file.cms.Files, 'move'])
      router.delete('/files/:id', [controllers.file.cms.Files, 'destroy'])
      router.post('/files/:id/alts', [controllers.file.cms.Files, 'upsertAlt'])
      router.delete('/files/:id/alts', [controllers.file.cms.Files, 'deleteAlt'])

      // File folders
      router.get('/files/folders', [controllers.file.cms.FileFolders, 'render'])
      router.post('/files/folders', [controllers.file.cms.FileFolders, 'execute'])
      router.put('/files/folders/:id', [controllers.file.cms.FileFolders, 'update'])
      router.delete('/files/folders/:id', [controllers.file.cms.FileFolders, 'destroy'])
    })
  })
  .prefix('admin')
  .as('admin')
  .use([middleware.auth()])

router
  .group(() => {
    router
      .group(() => {
        router
          .group(() => {
            router.post('theme', [controllers.preferences.api.Theme, 'execute'])
          })
          .prefix('preferences')
      })
      .prefix('settings')
      .use([middleware.auth()])

    router
      .group(() => {
        router
          .group(() => {
            router
              .post('/operations', [controllers.page.api.BuilderOperations, 'execute'])
              .use([middleware.permission({ permissions: ['pages.update'] })])
            router
              .get('/presence/:translationId', [controllers.page.api.BuilderOperations, 'presence'])
              .use([middleware.permission({ permissions: ['pages.update'] })])
            router
              .post('/draft/:translationId', [controllers.page.api.BuilderOperations, 'saveDraft'])
              .use([middleware.permission({ permissions: ['pages.update'] })])
          })
          .prefix('builder')
        router
          .group(() => {
            router
              .group(() => {
                router
                  .get('/token', [controllers.page.cms.PagesPreview, 'token'])
                  .use([middleware.permission({ permissions: ['pages.update'] })])
              })
              .prefix('preview')
          })
          .prefix('page')
        router
          .group(() => {
            router.get('/', [controllers.file.api.File, 'list'])
            router.get('/:id', [controllers.file.api.File, 'find'])
          })
          .prefix('files')
      })
      .prefix('admin')
      .as('admin')
      .use([middleware.auth()])
  })
  .prefix('api')
  .as('api')

router.post('/contact', [controllers.page.front.Contact, 'execute'])

router.get('/sitemap.xml', [controllers.page.front.Page, 'sitemap'])
router.get('/robots.txt', [controllers.page.front.Page, 'robots'])

router.get('/', [controllers.page.front.Page, 'home']).as('page.home')

router
  .get('/:locale/:slug', [controllers.page.front.Page, 'render'])
  .as('page.localised.render')
  .where('locale', /^[a-z]{2}(-[A-Z]{2})?$/)

router
  .get('/:slug', [controllers.page.front.Page, 'render'])
  .as('page.render')
  .where('slug', /^[a-z0-9-]+$/)
