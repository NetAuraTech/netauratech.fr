import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.session.render': { paramsTuple?: []; params?: {} }
    'auth.session.execute': { paramsTuple?: []; params?: {} }
    'auth.register.render': { paramsTuple?: []; params?: {} }
    'auth.register.execute': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.render': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.execute': { paramsTuple?: []; params?: {} }
    'auth.reset_password.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.reset_password.execute': { paramsTuple?: []; params?: {} }
    'auth.accept_invitation.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.accept_invitation.execute': { paramsTuple?: []; params?: {} }
    'auth.session.destroy': { paramsTuple?: []; params?: {} }
    'auth.email_verification.execute': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.social.render': { paramsTuple?: []; params?: {} }
    'auth.social.execute': { paramsTuple?: []; params?: {} }
    'auth.social.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.social.unlink': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'settings.profile.render': { paramsTuple?: []; params?: {} }
    'settings.profile.execute': { paramsTuple?: []; params?: {} }
    'settings.account.render': { paramsTuple?: []; params?: {} }
    'settings.account.execute': { paramsTuple?: []; params?: {} }
    'settings.account.destroy': { paramsTuple?: []; params?: {} }
    'settings.email_change.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'settings.email_change.execute': { paramsTuple?: []; params?: {} }
    'settings.preferences.render': { paramsTuple?: []; params?: {} }
    'settings.preferences.execute': { paramsTuple?: []; params?: {} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'admin.dashboard.render': { paramsTuple?: []; params?: {} }
    'admin.users.render': { paramsTuple?: []; params?: {} }
    'admin.users_create.render': { paramsTuple?: []; params?: {} }
    'admin.users_create.execute': { paramsTuple?: []; params?: {} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.render': { paramsTuple?: []; params?: {} }
    'admin.pages_create.render': { paramsTuple?: []; params?: {} }
    'admin.pages_create.execute': { paramsTuple?: []; params?: {} }
    'admin.pages_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.set_homepage': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_translations.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_revisions.index': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue} }
    'admin.page_revisions.restore': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue,'revisionId': ParamValue} }
    'admin.page_revisions.toggle_keep': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue,'revisionId': ParamValue} }
    'admin.pages_preview.render': { paramsTuple: [ParamValue]; params: {'pageId': ParamValue} }
    'admin.templates.render': { paramsTuple?: []; params?: {} }
    'admin.templates.execute': { paramsTuple?: []; params?: {} }
    'admin.templates.create_from_page': { paramsTuple?: []; params?: {} }
    'admin.templates.apply_to_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.templates.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.templates.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.render': { paramsTuple?: []; params?: {} }
    'admin.files.upload': { paramsTuple?: []; params?: {} }
    'admin.files.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.upsert_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.delete_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.render': { paramsTuple?: []; params?: {} }
    'admin.file_folders.execute': { paramsTuple?: []; params?: {} }
    'admin.file_folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.theme.execute': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.execute': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.presence': { paramsTuple: [ParamValue]; params: {'translationId': ParamValue} }
    'api.admin.builder_operations.save_draft': { paramsTuple: [ParamValue]; params: {'translationId': ParamValue} }
    'api.admin.pages_preview.token': { paramsTuple?: []; params?: {} }
    'api.admin.file.list': { paramsTuple?: []; params?: {} }
    'api.admin.file.find': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'contact.execute': { paramsTuple?: []; params?: {} }
    'page.sitemap': { paramsTuple?: []; params?: {} }
    'page.robots': { paramsTuple?: []; params?: {} }
    'page.home': { paramsTuple?: []; params?: {} }
    'page.localised.render': { paramsTuple: [ParamValue,ParamValue]; params: {'locale': ParamValue,'slug': ParamValue} }
    'page.render': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'auth.session.render': { paramsTuple?: []; params?: {} }
    'auth.register.render': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.render': { paramsTuple?: []; params?: {} }
    'auth.reset_password.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.accept_invitation.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.email_verification.execute': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.social.render': { paramsTuple?: []; params?: {} }
    'auth.social.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'settings.profile.render': { paramsTuple?: []; params?: {} }
    'settings.account.render': { paramsTuple?: []; params?: {} }
    'settings.email_change.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'settings.preferences.render': { paramsTuple?: []; params?: {} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'admin.dashboard.render': { paramsTuple?: []; params?: {} }
    'admin.users.render': { paramsTuple?: []; params?: {} }
    'admin.users_create.render': { paramsTuple?: []; params?: {} }
    'admin.users_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.render': { paramsTuple?: []; params?: {} }
    'admin.pages_create.render': { paramsTuple?: []; params?: {} }
    'admin.pages_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_revisions.index': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue} }
    'admin.pages_preview.render': { paramsTuple: [ParamValue]; params: {'pageId': ParamValue} }
    'admin.templates.render': { paramsTuple?: []; params?: {} }
    'admin.files.render': { paramsTuple?: []; params?: {} }
    'admin.file_folders.render': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.presence': { paramsTuple: [ParamValue]; params: {'translationId': ParamValue} }
    'api.admin.pages_preview.token': { paramsTuple?: []; params?: {} }
    'api.admin.file.list': { paramsTuple?: []; params?: {} }
    'api.admin.file.find': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'page.sitemap': { paramsTuple?: []; params?: {} }
    'page.robots': { paramsTuple?: []; params?: {} }
    'page.home': { paramsTuple?: []; params?: {} }
    'page.localised.render': { paramsTuple: [ParamValue,ParamValue]; params: {'locale': ParamValue,'slug': ParamValue} }
    'page.render': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'auth.session.render': { paramsTuple?: []; params?: {} }
    'auth.register.render': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.render': { paramsTuple?: []; params?: {} }
    'auth.reset_password.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.accept_invitation.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.email_verification.execute': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'auth.social.render': { paramsTuple?: []; params?: {} }
    'auth.social.redirect': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'auth.social.callback': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'settings.profile.render': { paramsTuple?: []; params?: {} }
    'settings.account.render': { paramsTuple?: []; params?: {} }
    'settings.email_change.render': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'settings.preferences.render': { paramsTuple?: []; params?: {} }
    'settings.index': { paramsTuple?: []; params?: {} }
    'admin.dashboard.render': { paramsTuple?: []; params?: {} }
    'admin.users.render': { paramsTuple?: []; params?: {} }
    'admin.users_create.render': { paramsTuple?: []; params?: {} }
    'admin.users_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.render': { paramsTuple?: []; params?: {} }
    'admin.pages_create.render': { paramsTuple?: []; params?: {} }
    'admin.pages_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_revisions.index': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue} }
    'admin.pages_preview.render': { paramsTuple: [ParamValue]; params: {'pageId': ParamValue} }
    'admin.templates.render': { paramsTuple?: []; params?: {} }
    'admin.files.render': { paramsTuple?: []; params?: {} }
    'admin.file_folders.render': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.presence': { paramsTuple: [ParamValue]; params: {'translationId': ParamValue} }
    'api.admin.pages_preview.token': { paramsTuple?: []; params?: {} }
    'api.admin.file.list': { paramsTuple?: []; params?: {} }
    'api.admin.file.find': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'page.sitemap': { paramsTuple?: []; params?: {} }
    'page.robots': { paramsTuple?: []; params?: {} }
    'page.home': { paramsTuple?: []; params?: {} }
    'page.localised.render': { paramsTuple: [ParamValue,ParamValue]; params: {'locale': ParamValue,'slug': ParamValue} }
    'page.render': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'auth.session.execute': { paramsTuple?: []; params?: {} }
    'auth.register.execute': { paramsTuple?: []; params?: {} }
    'auth.forgot_password.execute': { paramsTuple?: []; params?: {} }
    'auth.reset_password.execute': { paramsTuple?: []; params?: {} }
    'auth.accept_invitation.execute': { paramsTuple?: []; params?: {} }
    'auth.session.destroy': { paramsTuple?: []; params?: {} }
    'auth.social.execute': { paramsTuple?: []; params?: {} }
    'auth.social.unlink': { paramsTuple: [ParamValue]; params: {'provider': ParamValue} }
    'settings.profile.execute': { paramsTuple?: []; params?: {} }
    'settings.account.execute': { paramsTuple?: []; params?: {} }
    'settings.email_change.execute': { paramsTuple?: []; params?: {} }
    'settings.preferences.execute': { paramsTuple?: []; params?: {} }
    'admin.users_create.execute': { paramsTuple?: []; params?: {} }
    'admin.users_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_create.execute': { paramsTuple?: []; params?: {} }
    'admin.pages_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.publish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages_update.unpublish': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.set_homepage': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_translations.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.page_revisions.restore': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue,'revisionId': ParamValue} }
    'admin.page_revisions.toggle_keep': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'id': ParamValue,'translationId': ParamValue,'revisionId': ParamValue} }
    'admin.templates.execute': { paramsTuple?: []; params?: {} }
    'admin.templates.create_from_page': { paramsTuple?: []; params?: {} }
    'admin.templates.apply_to_page': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.upload': { paramsTuple?: []; params?: {} }
    'admin.files.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.upsert_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.execute': { paramsTuple?: []; params?: {} }
    'api.theme.execute': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.execute': { paramsTuple?: []; params?: {} }
    'api.admin.builder_operations.save_draft': { paramsTuple: [ParamValue]; params: {'translationId': ParamValue} }
    'contact.execute': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'settings.account.destroy': { paramsTuple?: []; params?: {} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.pages.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.templates.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.delete_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  PUT: {
    'admin.templates.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}