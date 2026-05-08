/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  drive: {
    fs: {
      serve: typeof routes['drive.fs.serve']
    }
  }
  eventStream: typeof routes['event_stream']
  subscribe: typeof routes['subscribe']
  unsubscribe: typeof routes['unsubscribe']
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
    pages: {
      render: typeof routes['admin.pages.render']
      setHomepage: typeof routes['admin.pages.set_homepage']
      destroy: typeof routes['admin.pages.destroy']
    }
    pagesCreate: {
      render: typeof routes['admin.pages_create.render']
      execute: typeof routes['admin.pages_create.execute']
    }
    pagesShow: {
      render: typeof routes['admin.pages_show.render']
    }
    pagesUpdate: {
      render: typeof routes['admin.pages_update.render']
      execute: typeof routes['admin.pages_update.execute']
      publish: typeof routes['admin.pages_update.publish']
      unpublish: typeof routes['admin.pages_update.unpublish']
    }
    pageTranslations: {
      execute: typeof routes['admin.page_translations.execute']
    }
    pageRevisions: {
      index: typeof routes['admin.page_revisions.index']
      restore: typeof routes['admin.page_revisions.restore']
      toggleKeep: typeof routes['admin.page_revisions.toggle_keep']
    }
    pagesPreview: {
      render: typeof routes['admin.pages_preview.render']
    }
    templates: {
      render: typeof routes['admin.templates.render']
      execute: typeof routes['admin.templates.execute']
      createFromPage: typeof routes['admin.templates.create_from_page']
      applyToPage: typeof routes['admin.templates.apply_to_page']
      update: typeof routes['admin.templates.update']
      destroy: typeof routes['admin.templates.destroy']
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
  }
  api: {
    theme: {
      execute: typeof routes['api.theme.execute']
    }
    admin: {
      builderOperations: {
        execute: typeof routes['api.admin.builder_operations.execute']
        presence: typeof routes['api.admin.builder_operations.presence']
        saveDraft: typeof routes['api.admin.builder_operations.save_draft']
      }
      pagesPreview: {
        token: typeof routes['api.admin.pages_preview.token']
      }
      file: {
        list: typeof routes['api.admin.file.list']
        find: typeof routes['api.admin.file.find']
      }
    }
  }
  contact: {
    execute: typeof routes['contact.execute']
  }
  page: {
    sitemap: typeof routes['page.sitemap']
    robots: typeof routes['page.robots']
    home: typeof routes['page.home']
    localised: {
      render: typeof routes['page.localised.render']
    }
    render: typeof routes['page.render']
  }
}
