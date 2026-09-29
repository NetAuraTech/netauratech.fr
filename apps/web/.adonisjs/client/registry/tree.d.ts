/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  admin: {
    file: {
      files: {
        render: typeof routes['admin.file.files.render']
        upload: typeof routes['admin.file.files.upload']
        move: typeof routes['admin.file.files.move']
        destroy: typeof routes['admin.file.files.destroy']
        upsertAlt: typeof routes['admin.file.files.upsert_alt']
        deleteAlt: typeof routes['admin.file.files.delete_alt']
      }
      fileFolders: {
        render: typeof routes['admin.file.file_folders.render']
        execute: typeof routes['admin.file.file_folders.execute']
        update: typeof routes['admin.file.file_folders.update']
        destroy: typeof routes['admin.file.file_folders.destroy']
      }
    }
    identity: {
      users: {
        render: typeof routes['admin.identity.users.render']
        destroy: typeof routes['admin.identity.users.destroy']
      }
      usersCreate: {
        render: typeof routes['admin.identity.users_create.render']
        execute: typeof routes['admin.identity.users_create.execute']
      }
      usersShow: {
        render: typeof routes['admin.identity.users_show.render']
      }
      usersUpdate: {
        render: typeof routes['admin.identity.users_update.render']
        execute: typeof routes['admin.identity.users_update.execute']
      }
      roles: {
        render: typeof routes['admin.identity.roles.render']
        destroy: typeof routes['admin.identity.roles.destroy']
      }
      rolesCreate: {
        render: typeof routes['admin.identity.roles_create.render']
        execute: typeof routes['admin.identity.roles_create.execute']
      }
      rolesShow: {
        render: typeof routes['admin.identity.roles_show.render']
      }
      rolesUpdate: {
        render: typeof routes['admin.identity.roles_update.render']
        execute: typeof routes['admin.identity.roles_update.execute']
      }
      permissions: {
        render: typeof routes['admin.identity.permissions.render']
        destroy: typeof routes['admin.identity.permissions.destroy']
      }
      permissionsCreate: {
        render: typeof routes['admin.identity.permissions_create.render']
        execute: typeof routes['admin.identity.permissions_create.execute']
      }
      permissionsUpdate: {
        render: typeof routes['admin.identity.permissions_update.render']
        execute: typeof routes['admin.identity.permissions_update.execute']
      }
    }
    log: {
      logs: {
        render: typeof routes['admin.log.logs.render']
      }
    }
    core: {
      dashboard: {
        render: typeof routes['admin.core.dashboard.render']
      }
      maintenance: {
        render: typeof routes['admin.core.maintenance.render']
        update: typeof routes['admin.core.maintenance.update']
        toggle: typeof routes['admin.core.maintenance.toggle']
      }
    }
  }
  core: {
    sitemap: {
      show: typeof routes['core.sitemap.show']
    }
    robots: {
      show: typeof routes['core.robots.show']
    }
    docs: {
      show: typeof routes['core.docs.show']
    }
    openapi: {
      spec: typeof routes['core.openapi.spec']
    }
    home: {
      render: typeof routes['core.home.render']
    }
  }
  account: {
    profile: {
      render: typeof routes['account.profile.render']
      execute: typeof routes['account.profile.execute']
    }
    account: {
      render: typeof routes['account.account.render']
      execute: typeof routes['account.account.execute']
      destroy: typeof routes['account.account.destroy']
    }
    emailChange: {
      render: typeof routes['account.email_change.render']
      execute: typeof routes['account.email_change.execute']
    }
    preferences: {
      render: typeof routes['account.preferences.render']
      execute: typeof routes['account.preferences.execute']
    }
    index: typeof routes['account.index']
  }
  api: {
    v1: {
      account: {
        profile: {
          show: typeof routes['api.v1.account.profile.show']
          update: typeof routes['api.v1.account.profile.update']
        }
        account: {
          update: typeof routes['api.v1.account.account.update']
          destroy: typeof routes['api.v1.account.account.destroy']
        }
      }
      admin: {
        account: {
          preferences: {
            execute: typeof routes['api.v1.admin.account.preferences.execute']
          }
        }
        file: {
          files: {
            index: typeof routes['api.v1.admin.file.files.index']
            store: typeof routes['api.v1.admin.file.files.store']
            show: typeof routes['api.v1.admin.file.files.show']
            move: typeof routes['api.v1.admin.file.files.move']
            destroy: typeof routes['api.v1.admin.file.files.destroy']
            upsertAlt: typeof routes['api.v1.admin.file.files.upsert_alt']
            deleteAlt: typeof routes['api.v1.admin.file.files.delete_alt']
          }
          folders: {
            index: typeof routes['api.v1.admin.file.folders.index']
            store: typeof routes['api.v1.admin.file.folders.store']
            show: typeof routes['api.v1.admin.file.folders.show']
            children: typeof routes['api.v1.admin.file.folders.children']
            update: typeof routes['api.v1.admin.file.folders.update']
            destroy: typeof routes['api.v1.admin.file.folders.destroy']
          }
        }
        identity: {
          users: {
            index: typeof routes['api.v1.admin.identity.users.index']
            store: typeof routes['api.v1.admin.identity.users.store']
            show: typeof routes['api.v1.admin.identity.users.show']
            update: typeof routes['api.v1.admin.identity.users.update']
            destroy: typeof routes['api.v1.admin.identity.users.destroy']
          }
          roles: {
            index: typeof routes['api.v1.admin.identity.roles.index']
            store: typeof routes['api.v1.admin.identity.roles.store']
            show: typeof routes['api.v1.admin.identity.roles.show']
            update: typeof routes['api.v1.admin.identity.roles.update']
            destroy: typeof routes['api.v1.admin.identity.roles.destroy']
          }
          permissions: {
            index: typeof routes['api.v1.admin.identity.permissions.index']
          }
        }
        log: {
          logs: {
            index: typeof routes['api.v1.admin.log.logs.index']
          }
        }
        core: {
          dashboard: {
            index: typeof routes['api.v1.admin.core.dashboard.index']
          }
          maintenance: {
            index: typeof routes['api.v1.admin.core.maintenance.index']
            update: typeof routes['api.v1.admin.core.maintenance.update']
            toggle: typeof routes['api.v1.admin.core.maintenance.toggle']
          }
        }
      }
      auth: {
        login: {
          execute: typeof routes['api.v1.auth.login.execute']
        }
        register: {
          store: typeof routes['api.v1.auth.register.store']
        }
        forgotPassword: {
          store: typeof routes['api.v1.auth.forgot_password.store']
        }
        resetPassword: {
          store: typeof routes['api.v1.auth.reset_password.store']
        }
        emailVerification: {
          store: typeof routes['api.v1.auth.email_verification.store']
        }
        acceptInvitation: {
          store: typeof routes['api.v1.auth.accept_invitation.store']
        }
        logout: {
          destroy: typeof routes['api.v1.auth.logout.destroy']
        }
        me: {
          show: typeof routes['api.v1.auth.me.show']
        }
      }
    }
  }
  auth: {
    session: {
      render: typeof routes['auth.session.render']
      execute: typeof routes['auth.session.execute']
      destroy: typeof routes['auth.session.destroy']
    }
    twoFactor: {
      render: typeof routes['auth.two_factor.render']
      verify: typeof routes['auth.two_factor.verify']
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
  health: {
    liveness: typeof routes['health.liveness']
    readiness: typeof routes['health.readiness']
  }
}
