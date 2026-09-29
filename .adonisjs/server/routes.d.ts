import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'health.liveness': { paramsTuple?: []; params?: {} }
    'health.readiness': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple?: []; params?: {} }
    'robots.show': { paramsTuple?: []; params?: {} }
    'front.home': { paramsTuple?: []; params?: {} }
    'front.services': { paramsTuple?: []; params?: {} }
    'front.projects': { paramsTuple?: []; params?: {} }
    'front.projects.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
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
    'admin.roles.render': { paramsTuple?: []; params?: {} }
    'admin.roles_create.render': { paramsTuple?: []; params?: {} }
    'admin.roles_create.execute': { paramsTuple?: []; params?: {} }
    'admin.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_create.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_create.execute': { paramsTuple?: []; params?: {} }
    'admin.permissions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
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
    'admin.settings.maintenance.render': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.update': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.toggle': { paramsTuple?: []; params?: {} }
    'admin.logs.render': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_create_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.users_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.users_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.roles_create_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.roles_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.files_upload_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.files_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_api.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_alt_api.upsert_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_alt_api.delete_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.folders_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.folders_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_show_api.children': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.theme.execute': { paramsTuple?: []; params?: {} }
    'api.v1.admin.dashboard_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.logs_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.update': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.toggle': { paramsTuple?: []; params?: {} }
    'api.v1.admin.permissions_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.auth.token.execute': { paramsTuple?: []; params?: {} }
    'api.v1.auth.register_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.forgot_password_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.reset_password_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.email_verification_api.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'api.v1.auth.accept_invitation_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.token.destroy': { paramsTuple?: []; params?: {} }
    'api.v1.auth.me.show': { paramsTuple?: []; params?: {} }
    'api.v1.profile.profile_api.show': { paramsTuple?: []; params?: {} }
    'api.v1.profile.profile_api.update': { paramsTuple?: []; params?: {} }
    'api.v1.account.account_api.update': { paramsTuple?: []; params?: {} }
    'api.v1.account.account_api.destroy': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'health.liveness': { paramsTuple?: []; params?: {} }
    'health.readiness': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple?: []; params?: {} }
    'robots.show': { paramsTuple?: []; params?: {} }
    'front.home': { paramsTuple?: []; params?: {} }
    'front.services': { paramsTuple?: []; params?: {} }
    'front.projects': { paramsTuple?: []; params?: {} }
    'front.projects.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
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
    'admin.roles.render': { paramsTuple?: []; params?: {} }
    'admin.roles_create.render': { paramsTuple?: []; params?: {} }
    'admin.roles_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_create.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.render': { paramsTuple?: []; params?: {} }
    'admin.file_folders.render': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.render': { paramsTuple?: []; params?: {} }
    'admin.logs.render': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.roles_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.files_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.folders_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_show_api.children': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.dashboard_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.logs_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.permissions_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.auth.me.show': { paramsTuple?: []; params?: {} }
    'api.v1.profile.profile_api.show': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'drive.fs.serve': { paramsTuple: [...ParamValue[]]; params: {'*': ParamValue[]} }
    'health.liveness': { paramsTuple?: []; params?: {} }
    'health.readiness': { paramsTuple?: []; params?: {} }
    'sitemap.show': { paramsTuple?: []; params?: {} }
    'robots.show': { paramsTuple?: []; params?: {} }
    'front.home': { paramsTuple?: []; params?: {} }
    'front.services': { paramsTuple?: []; params?: {} }
    'front.projects': { paramsTuple?: []; params?: {} }
    'front.projects.show': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
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
    'admin.roles.render': { paramsTuple?: []; params?: {} }
    'admin.roles_create.render': { paramsTuple?: []; params?: {} }
    'admin.roles_show.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_create.render': { paramsTuple?: []; params?: {} }
    'admin.permissions_update.render': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.render': { paramsTuple?: []; params?: {} }
    'admin.file_folders.render': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.render': { paramsTuple?: []; params?: {} }
    'admin.logs.render': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.roles_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.files_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.folders_show_api.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_show_api.children': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.dashboard_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.logs_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.admin.permissions_api.index': { paramsTuple?: []; params?: {} }
    'api.v1.auth.me.show': { paramsTuple?: []; params?: {} }
    'api.v1.profile.profile_api.show': { paramsTuple?: []; params?: {} }
  }
  POST: {
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
    'admin.roles_create.execute': { paramsTuple?: []; params?: {} }
    'admin.roles_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions_create.execute': { paramsTuple?: []; params?: {} }
    'admin.permissions_update.execute': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.upload': { paramsTuple?: []; params?: {} }
    'admin.files.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.upsert_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.execute': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.update': { paramsTuple?: []; params?: {} }
    'admin.settings.maintenance.toggle': { paramsTuple?: []; params?: {} }
    'api.v1.admin.users_create_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.roles_create_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.files_upload_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.folders_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.admin.theme.execute': { paramsTuple?: []; params?: {} }
    'api.v1.auth.token.execute': { paramsTuple?: []; params?: {} }
    'api.v1.auth.register_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.forgot_password_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.reset_password_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.email_verification_api.store': { paramsTuple: [ParamValue]; params: {'token': ParamValue} }
    'api.v1.auth.accept_invitation_api.store': { paramsTuple?: []; params?: {} }
    'api.v1.auth.token.destroy': { paramsTuple?: []; params?: {} }
  }
  DELETE: {
    'settings.account.destroy': { paramsTuple?: []; params?: {} }
    'admin.users.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.roles.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.permissions.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.files.delete_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.file_folders.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.users_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_alt_api.delete_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_delete_api.destroy': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.account.account_api.destroy': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'admin.file_folders.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.users_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.roles_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_api.move': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.files_alt_api.upsert_alt': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.folders_update_api.update': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'api.v1.admin.maintenance_api.update': { paramsTuple?: []; params?: {} }
    'api.v1.admin.maintenance_api.toggle': { paramsTuple?: []; params?: {} }
    'api.v1.profile.profile_api.update': { paramsTuple?: []; params?: {} }
    'api.v1.account.account_api.update': { paramsTuple?: []; params?: {} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}