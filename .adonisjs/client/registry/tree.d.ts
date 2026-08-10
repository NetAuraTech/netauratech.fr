/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  health: {
    liveness: typeof routes['health.liveness']
    readiness: typeof routes['health.readiness']
  }
  sitemap: {
    show: typeof routes['sitemap.show']
  }
  robots: {
    show: typeof routes['robots.show']
  }
  front: {
    home: typeof routes['front.home']
  }
  auth: {
    session: {
      render: typeof routes['auth.session.render']
      execute: typeof routes['auth.session.execute']
      destroy: typeof routes['auth.session.destroy']
    }
    register: {
      render: typeof routes['auth.register.render']
      execute: typeof routes['auth.register.execute']
    }
    forgotPassword: {
      render: typeof routes['auth.forgot_password.render']
      execute: typeof routes['auth.forgot_password.execute']
    }
    resetPassword: {
      render: typeof routes['auth.reset_password.render']
      execute: typeof routes['auth.reset_password.execute']
    }
    acceptInvitation: {
      render: typeof routes['auth.accept_invitation.render']
      execute: typeof routes['auth.accept_invitation.execute']
    }
    emailVerification: {
      execute: typeof routes['auth.email_verification.execute']
    }
    social: {
      render: typeof routes['auth.social.render']
      execute: typeof routes['auth.social.execute']
      redirect: typeof routes['auth.social.redirect']
      callback: typeof routes['auth.social.callback']
      unlink: typeof routes['auth.social.unlink']
    }
  }
  settings: {
    profile: {
      render: typeof routes['settings.profile.render']
      execute: typeof routes['settings.profile.execute']
    }
    account: {
      render: typeof routes['settings.account.render']
      execute: typeof routes['settings.account.execute']
      destroy: typeof routes['settings.account.destroy']
    }
    emailChange: {
      render: typeof routes['settings.email_change.render']
      execute: typeof routes['settings.email_change.execute']
    }
    preferences: {
      render: typeof routes['settings.preferences.render']
      execute: typeof routes['settings.preferences.execute']
    }
    index: typeof routes['settings.index']
  }
  admin: {
    dashboard: {
      render: typeof routes['admin.dashboard.render']
    }
    users: {
      render: typeof routes['admin.users.render']
      destroy: typeof routes['admin.users.destroy']
    }
    usersCreate: {
      render: typeof routes['admin.users_create.render']
      execute: typeof routes['admin.users_create.execute']
    }
    usersShow: {
      render: typeof routes['admin.users_show.render']
    }
    usersUpdate: {
      render: typeof routes['admin.users_update.render']
      execute: typeof routes['admin.users_update.execute']
    }
    roles: {
      render: typeof routes['admin.roles.render']
      destroy: typeof routes['admin.roles.destroy']
    }
    rolesCreate: {
      render: typeof routes['admin.roles_create.render']
      execute: typeof routes['admin.roles_create.execute']
    }
    rolesShow: {
      render: typeof routes['admin.roles_show.render']
    }
    rolesUpdate: {
      render: typeof routes['admin.roles_update.render']
      execute: typeof routes['admin.roles_update.execute']
    }
    permissions: {
      render: typeof routes['admin.permissions.render']
      destroy: typeof routes['admin.permissions.destroy']
    }
    permissionsCreate: {
      render: typeof routes['admin.permissions_create.render']
      execute: typeof routes['admin.permissions_create.execute']
    }
    permissionsUpdate: {
      render: typeof routes['admin.permissions_update.render']
      execute: typeof routes['admin.permissions_update.execute']
    }
    files: {
      render: typeof routes['admin.files.render']
      upload: typeof routes['admin.files.upload']
      move: typeof routes['admin.files.move']
      destroy: typeof routes['admin.files.destroy']
      upsertAlt: typeof routes['admin.files.upsert_alt']
      deleteAlt: typeof routes['admin.files.delete_alt']
    }
    fileFolders: {
      render: typeof routes['admin.file_folders.render']
      execute: typeof routes['admin.file_folders.execute']
      update: typeof routes['admin.file_folders.update']
      destroy: typeof routes['admin.file_folders.destroy']
    }
    settings: {
      maintenance: {
        render: typeof routes['admin.settings.maintenance.render']
        update: typeof routes['admin.settings.maintenance.update']
        toggle: typeof routes['admin.settings.maintenance.toggle']
      }
    }
    logs: {
      render: typeof routes['admin.logs.render']
    }
  }
  api: {
    v1: {
      admin: {
        usersApi: {
          index: typeof routes['api.v1.admin.users_api.index']
        }
        usersCreateApi: {
          store: typeof routes['api.v1.admin.users_create_api.store']
        }
        usersShowApi: {
          show: typeof routes['api.v1.admin.users_show_api.show']
        }
        usersUpdateApi: {
          update: typeof routes['api.v1.admin.users_update_api.update']
        }
        usersDeleteApi: {
          destroy: typeof routes['api.v1.admin.users_delete_api.destroy']
        }
        rolesApi: {
          index: typeof routes['api.v1.admin.roles_api.index']
        }
        rolesCreateApi: {
          store: typeof routes['api.v1.admin.roles_create_api.store']
        }
        rolesShowApi: {
          show: typeof routes['api.v1.admin.roles_show_api.show']
        }
        rolesUpdateApi: {
          update: typeof routes['api.v1.admin.roles_update_api.update']
        }
        rolesDeleteApi: {
          destroy: typeof routes['api.v1.admin.roles_delete_api.destroy']
        }
        filesApi: {
          index: typeof routes['api.v1.admin.files_api.index']
          move: typeof routes['api.v1.admin.files_api.move']
        }
        filesUploadApi: {
          store: typeof routes['api.v1.admin.files_upload_api.store']
        }
        filesShowApi: {
          show: typeof routes['api.v1.admin.files_show_api.show']
        }
        filesDeleteApi: {
          destroy: typeof routes['api.v1.admin.files_delete_api.destroy']
        }
        filesAltApi: {
          upsertAlt: typeof routes['api.v1.admin.files_alt_api.upsert_alt']
          deleteAlt: typeof routes['api.v1.admin.files_alt_api.delete_alt']
        }
        foldersApi: {
          index: typeof routes['api.v1.admin.folders_api.index']
          store: typeof routes['api.v1.admin.folders_api.store']
        }
        foldersShowApi: {
          show: typeof routes['api.v1.admin.folders_show_api.show']
          children: typeof routes['api.v1.admin.folders_show_api.children']
        }
        foldersUpdateApi: {
          update: typeof routes['api.v1.admin.folders_update_api.update']
        }
        foldersDeleteApi: {
          destroy: typeof routes['api.v1.admin.folders_delete_api.destroy']
        }
        theme: {
          execute: typeof routes['api.v1.admin.theme.execute']
        }
        dashboardApi: {
          index: typeof routes['api.v1.admin.dashboard_api.index']
        }
        logsApi: {
          index: typeof routes['api.v1.admin.logs_api.index']
        }
        maintenanceApi: {
          index: typeof routes['api.v1.admin.maintenance_api.index']
          update: typeof routes['api.v1.admin.maintenance_api.update']
          toggle: typeof routes['api.v1.admin.maintenance_api.toggle']
        }
        permissionsApi: {
          index: typeof routes['api.v1.admin.permissions_api.index']
        }
      }
    }
  }
}
