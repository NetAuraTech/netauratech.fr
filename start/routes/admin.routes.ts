/*
|--------------------------------------------------------------------------
| Admin routes
|--------------------------------------------------------------------------
|
| Dashboard, users CRUD, files, file folders.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'
import { controllers } from '#generated/controllers'

export function registerAdminRoutes(): void {
  router
    .group(() => {
      router
        .get('/', [controllers.core.admin.Dashboard, 'render'])
        .use([middleware.permission({ permissions: ['admin.access'] })])

      router
        .group(() => {
          router
            .get('/', [controllers.auth.admin.Users, 'render'])
            .use([middleware.permission({ permissions: ['users.view'] })])

          router
            .group(() => {
              router.get('/', [controllers.auth.admin.UsersCreate, 'render'])
              router.post('/', [controllers.auth.admin.UsersCreate, 'execute'])
            })
            .prefix('create')
            .use([middleware.permission({ permissions: ['users.create'] })])

          router
            .group(() => {
              router
                .delete('/', [controllers.auth.admin.Users, 'destroy'])
                .use([middleware.permission({ permissions: ['users.delete'] })])
              router
                .get('/', [controllers.auth.admin.UsersShow, 'render'])
                .use([middleware.permission({ permissions: ['users.view'] })])

              router
                .group(() => {
                  router.get('/', [controllers.auth.admin.UsersUpdate, 'render'])
                  router.post('/', [controllers.auth.admin.UsersUpdate, 'execute'])
                })
                .prefix('edit')
                .use([middleware.permission({ permissions: ['users.update'] })])
            })
            .prefix(':id')
        })
        .prefix('users')

      router
        .group(() => {
          router
            .get('/', [controllers.auth.admin.Roles, 'render'])
            .use([middleware.permission({ permissions: ['roles.view'] })])

          router
            .group(() => {
              router.get('/', [controllers.auth.admin.RolesCreate, 'render'])
              router.post('/', [controllers.auth.admin.RolesCreate, 'execute'])
            })
            .prefix('create')
            .use([middleware.permission({ permissions: ['roles.create'] })])

          router
            .group(() => {
              router
                .delete('/', [controllers.auth.admin.Roles, 'destroy'])
                .use([middleware.permission({ permissions: ['roles.delete'] })])
              router
                .get('/', [controllers.auth.admin.RolesShow, 'render'])
                .use([middleware.permission({ permissions: ['roles.view'] })])

              router
                .group(() => {
                  router.get('/', [controllers.auth.admin.RolesUpdate, 'render'])
                  router.post('/', [controllers.auth.admin.RolesUpdate, 'execute'])
                })
                .prefix('edit')
                .use([middleware.permission({ permissions: ['roles.update'] })])
            })
            .prefix(':id')
        })
        .prefix('roles')

      router
        .group(() => {
          router
            .get('/', [controllers.auth.admin.Permissions, 'render'])
            .use([middleware.permission({ permissions: ['permissions.view'] })])

          router
            .group(() => {
              router.get('/', [controllers.auth.admin.PermissionsCreate, 'render'])
              router.post('/', [controllers.auth.admin.PermissionsCreate, 'execute'])
            })
            .prefix('create')
            .use([middleware.permission({ permissions: ['permissions.create'] })])

          router
            .group(() => {
              router
                .delete('/', [controllers.auth.admin.Permissions, 'destroy'])
                .use([middleware.permission({ permissions: ['permissions.delete'] })])

              router
                .group(() => {
                  router.get('/', [controllers.auth.admin.PermissionsUpdate, 'render'])
                  router.post('/', [controllers.auth.admin.PermissionsUpdate, 'execute'])
                })
                .prefix('edit')
                .use([middleware.permission({ permissions: ['permissions.update'] })])
            })
            .prefix(':id')
        })
        .prefix('permissions')

      router.group(() => {
        // Files
        router
          .group(() => {
            router
              .get('/', [controllers.file.admin.Files, 'render'])
              .use([middleware.permission({ permissions: ['files.view'] })])
            router
              .post('/upload', [controllers.file.admin.Files, 'upload'])
              .use([middleware.permission({ permissions: ['files.create'] })])
            router
              .post('/:id/move', [controllers.file.admin.Files, 'move'])
              .use([middleware.permission({ permissions: ['files.update'] })])
            router
              .delete('/:id', [controllers.file.admin.Files, 'destroy'])
              .use([middleware.permission({ permissions: ['files.delete'] })])
            router
              .post('/:id/alts', [controllers.file.admin.Files, 'upsertAlt'])
              .use([middleware.permission({ permissions: ['files.update'] })])
            router
              .delete('/:id/alts', [controllers.file.admin.Files, 'deleteAlt'])
              .use([middleware.permission({ permissions: ['files.update'] })])
          })
          .prefix('files')

        // File folders
        router
          .group(() => {
            router
              .get('/', [controllers.file.admin.FileFolders, 'render'])
              .use([middleware.permission({ permissions: ['folders.view'] })])
            router
              .post('/', [controllers.file.admin.FileFolders, 'execute'])
              .use([middleware.permission({ permissions: ['folders.create'] })])
            router
              .put('/:id', [controllers.file.admin.FileFolders, 'update'])
              .use([middleware.permission({ permissions: ['folders.update'] })])
            router
              .delete('/:id', [controllers.file.admin.FileFolders, 'destroy'])
              .use([middleware.permission({ permissions: ['folders.delete'] })])
          })
          .prefix('files/folders')

        // Settings - Maintenance
        router
          .group(() => {
            router
              .group(() => {
                router
                  .get('/maintenance', [controllers.maintenance.admin.Maintenance, 'render'])
                  .as('maintenance.render')
                router
                  .post('/maintenance', [controllers.maintenance.admin.Maintenance, 'update'])
                  .as('maintenance.update')
                router
                  .post('/maintenance/toggle', [
                    controllers.maintenance.admin.Maintenance,
                    'toggle',
                  ])
                  .as('maintenance.toggle')
              })
              .prefix('settings')
              .as('settings')
              .use([middleware.permission({ permissions: ['settings.maintenance'] })])
          })
          .use([middleware.auth({ guards: ['web'] })])

        // Logs
        router
          .group(() => {
            router
              .get('/', [controllers.log.admin.Logs, 'render'])
              .as('logs.render')
              .use([middleware.permission({ permissions: ['logs.view'] })])
          })
          .prefix('logs')
          .use([middleware.auth({ guards: ['web'] })])
      })
    })
    .prefix('admin')
    .as('admin')
    .use([middleware.auth({ guards: ['web'] })])
}
