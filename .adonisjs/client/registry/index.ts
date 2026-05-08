/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'drive.fs.serve': {
    methods: ["GET","HEAD"],
    pattern: '/uploads/*',
    tokens: [{"old":"/uploads/*","type":0,"val":"uploads","end":""},{"old":"/uploads/*","type":2,"val":"*","end":""}],
    types: placeholder as Registry['drive.fs.serve']['types'],
  },
  'event_stream': {
    methods: ["GET","HEAD"],
    pattern: '/__transmit/events',
    tokens: [{"old":"/__transmit/events","type":0,"val":"__transmit","end":""},{"old":"/__transmit/events","type":0,"val":"events","end":""}],
    types: placeholder as Registry['event_stream']['types'],
  },
  'subscribe': {
    methods: ["POST"],
    pattern: '/__transmit/subscribe',
    tokens: [{"old":"/__transmit/subscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/subscribe","type":0,"val":"subscribe","end":""}],
    types: placeholder as Registry['subscribe']['types'],
  },
  'unsubscribe': {
    methods: ["POST"],
    pattern: '/__transmit/unsubscribe',
    tokens: [{"old":"/__transmit/unsubscribe","type":0,"val":"__transmit","end":""},{"old":"/__transmit/unsubscribe","type":0,"val":"unsubscribe","end":""}],
    types: placeholder as Registry['unsubscribe']['types'],
  },
  'auth.session.render': {
    methods: ["GET","HEAD"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.session.render']['types'],
  },
  'auth.session.execute': {
    methods: ["POST"],
    pattern: '/login',
    tokens: [{"old":"/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.session.execute']['types'],
  },
  'auth.register.render': {
    methods: ["GET","HEAD"],
    pattern: '/register',
    tokens: [{"old":"/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register.render']['types'],
  },
  'auth.register.execute': {
    methods: ["POST"],
    pattern: '/register',
    tokens: [{"old":"/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register.execute']['types'],
  },
  'auth.forgot_password.render': {
    methods: ["GET","HEAD"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['auth.forgot_password.render']['types'],
  },
  'auth.forgot_password.execute': {
    methods: ["POST"],
    pattern: '/forgot-password',
    tokens: [{"old":"/forgot-password","type":0,"val":"forgot-password","end":""}],
    types: placeholder as Registry['auth.forgot_password.execute']['types'],
  },
  'auth.reset_password.render': {
    methods: ["GET","HEAD"],
    pattern: '/reset-password/:token',
    tokens: [{"old":"/reset-password/:token","type":0,"val":"reset-password","end":""},{"old":"/reset-password/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['auth.reset_password.render']['types'],
  },
  'auth.reset_password.execute': {
    methods: ["POST"],
    pattern: '/reset-password',
    tokens: [{"old":"/reset-password","type":0,"val":"reset-password","end":""}],
    types: placeholder as Registry['auth.reset_password.execute']['types'],
  },
  'auth.accept_invitation.render': {
    methods: ["GET","HEAD"],
    pattern: '/accept-invitation/:token',
    tokens: [{"old":"/accept-invitation/:token","type":0,"val":"accept-invitation","end":""},{"old":"/accept-invitation/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['auth.accept_invitation.render']['types'],
  },
  'auth.accept_invitation.execute': {
    methods: ["POST"],
    pattern: '/accept-invitation',
    tokens: [{"old":"/accept-invitation","type":0,"val":"accept-invitation","end":""}],
    types: placeholder as Registry['auth.accept_invitation.execute']['types'],
  },
  'auth.session.destroy': {
    methods: ["POST"],
    pattern: '/logout',
    tokens: [{"old":"/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.session.destroy']['types'],
  },
  'auth.email_verification.execute': {
    methods: ["GET","HEAD"],
    pattern: '/verify/:token',
    tokens: [{"old":"/verify/:token","type":0,"val":"verify","end":""},{"old":"/verify/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['auth.email_verification.execute']['types'],
  },
  'auth.social.render': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/define-password',
    tokens: [{"old":"/oauth/define-password","type":0,"val":"oauth","end":""},{"old":"/oauth/define-password","type":0,"val":"define-password","end":""}],
    types: placeholder as Registry['auth.social.render']['types'],
  },
  'auth.social.execute': {
    methods: ["POST"],
    pattern: '/oauth/define-password',
    tokens: [{"old":"/oauth/define-password","type":0,"val":"oauth","end":""},{"old":"/oauth/define-password","type":0,"val":"define-password","end":""}],
    types: placeholder as Registry['auth.social.execute']['types'],
  },
  'auth.social.redirect': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/:provider',
    tokens: [{"old":"/oauth/:provider","type":0,"val":"oauth","end":""},{"old":"/oauth/:provider","type":1,"val":"provider","end":""}],
    types: placeholder as Registry['auth.social.redirect']['types'],
  },
  'auth.social.callback': {
    methods: ["GET","HEAD"],
    pattern: '/oauth/:provider/callback',
    tokens: [{"old":"/oauth/:provider/callback","type":0,"val":"oauth","end":""},{"old":"/oauth/:provider/callback","type":1,"val":"provider","end":""},{"old":"/oauth/:provider/callback","type":0,"val":"callback","end":""}],
    types: placeholder as Registry['auth.social.callback']['types'],
  },
  'auth.social.unlink': {
    methods: ["POST"],
    pattern: '/oauth/:provider/unlink',
    tokens: [{"old":"/oauth/:provider/unlink","type":0,"val":"oauth","end":""},{"old":"/oauth/:provider/unlink","type":1,"val":"provider","end":""},{"old":"/oauth/:provider/unlink","type":0,"val":"unlink","end":""}],
    types: placeholder as Registry['auth.social.unlink']['types'],
  },
  'settings.profile.render': {
    methods: ["GET","HEAD"],
    pattern: '/settings/profile',
    tokens: [{"old":"/settings/profile","type":0,"val":"settings","end":""},{"old":"/settings/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['settings.profile.render']['types'],
  },
  'settings.profile.execute': {
    methods: ["POST"],
    pattern: '/settings/profile',
    tokens: [{"old":"/settings/profile","type":0,"val":"settings","end":""},{"old":"/settings/profile","type":0,"val":"profile","end":""}],
    types: placeholder as Registry['settings.profile.execute']['types'],
  },
  'settings.account.render': {
    methods: ["GET","HEAD"],
    pattern: '/settings/account',
    tokens: [{"old":"/settings/account","type":0,"val":"settings","end":""},{"old":"/settings/account","type":0,"val":"account","end":""}],
    types: placeholder as Registry['settings.account.render']['types'],
  },
  'settings.account.execute': {
    methods: ["POST"],
    pattern: '/settings/account',
    tokens: [{"old":"/settings/account","type":0,"val":"settings","end":""},{"old":"/settings/account","type":0,"val":"account","end":""}],
    types: placeholder as Registry['settings.account.execute']['types'],
  },
  'settings.account.destroy': {
    methods: ["DELETE"],
    pattern: '/settings/account',
    tokens: [{"old":"/settings/account","type":0,"val":"settings","end":""},{"old":"/settings/account","type":0,"val":"account","end":""}],
    types: placeholder as Registry['settings.account.destroy']['types'],
  },
  'settings.email_change.render': {
    methods: ["GET","HEAD"],
    pattern: '/settings/account/email_change/:token',
    tokens: [{"old":"/settings/account/email_change/:token","type":0,"val":"settings","end":""},{"old":"/settings/account/email_change/:token","type":0,"val":"account","end":""},{"old":"/settings/account/email_change/:token","type":0,"val":"email_change","end":""},{"old":"/settings/account/email_change/:token","type":1,"val":"token","end":""}],
    types: placeholder as Registry['settings.email_change.render']['types'],
  },
  'settings.email_change.execute': {
    methods: ["POST"],
    pattern: '/settings/account/email_change',
    tokens: [{"old":"/settings/account/email_change","type":0,"val":"settings","end":""},{"old":"/settings/account/email_change","type":0,"val":"account","end":""},{"old":"/settings/account/email_change","type":0,"val":"email_change","end":""}],
    types: placeholder as Registry['settings.email_change.execute']['types'],
  },
  'settings.preferences.render': {
    methods: ["GET","HEAD"],
    pattern: '/settings/preferences',
    tokens: [{"old":"/settings/preferences","type":0,"val":"settings","end":""},{"old":"/settings/preferences","type":0,"val":"preferences","end":""}],
    types: placeholder as Registry['settings.preferences.render']['types'],
  },
  'settings.preferences.execute': {
    methods: ["POST"],
    pattern: '/settings/preferences',
    tokens: [{"old":"/settings/preferences","type":0,"val":"settings","end":""},{"old":"/settings/preferences","type":0,"val":"preferences","end":""}],
    types: placeholder as Registry['settings.preferences.execute']['types'],
  },
  'settings.index': {
    methods: ["GET","HEAD"],
    pattern: '/settings',
    tokens: [{"old":"/settings","type":0,"val":"settings","end":""}],
    types: placeholder as Registry['settings.index']['types'],
  },
  'admin.dashboard.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin',
    tokens: [{"old":"/admin","type":0,"val":"admin","end":""}],
    types: placeholder as Registry['admin.dashboard.render']['types'],
  },
  'admin.users.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users',
    tokens: [{"old":"/admin/users","type":0,"val":"admin","end":""},{"old":"/admin/users","type":0,"val":"users","end":""}],
    types: placeholder as Registry['admin.users.render']['types'],
  },
  'admin.users_create.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/create',
    tokens: [{"old":"/admin/users/create","type":0,"val":"admin","end":""},{"old":"/admin/users/create","type":0,"val":"users","end":""},{"old":"/admin/users/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.users_create.render']['types'],
  },
  'admin.users_create.execute': {
    methods: ["POST"],
    pattern: '/admin/users/create',
    tokens: [{"old":"/admin/users/create","type":0,"val":"admin","end":""},{"old":"/admin/users/create","type":0,"val":"users","end":""},{"old":"/admin/users/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.users_create.execute']['types'],
  },
  'admin.users.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/users/:id',
    tokens: [{"old":"/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/admin/users/:id","type":0,"val":"users","end":""},{"old":"/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.users.destroy']['types'],
  },
  'admin.users_show.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/:id',
    tokens: [{"old":"/admin/users/:id","type":0,"val":"admin","end":""},{"old":"/admin/users/:id","type":0,"val":"users","end":""},{"old":"/admin/users/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.users_show.render']['types'],
  },
  'admin.users_update.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/users/:id/edit',
    tokens: [{"old":"/admin/users/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"users","end":""},{"old":"/admin/users/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.users_update.render']['types'],
  },
  'admin.users_update.execute': {
    methods: ["POST"],
    pattern: '/admin/users/:id/edit',
    tokens: [{"old":"/admin/users/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"users","end":""},{"old":"/admin/users/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/users/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.users_update.execute']['types'],
  },
  'admin.pages.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages',
    tokens: [{"old":"/admin/pages","type":0,"val":"admin","end":""},{"old":"/admin/pages","type":0,"val":"pages","end":""}],
    types: placeholder as Registry['admin.pages.render']['types'],
  },
  'admin.pages_create.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages/create',
    tokens: [{"old":"/admin/pages/create","type":0,"val":"admin","end":""},{"old":"/admin/pages/create","type":0,"val":"pages","end":""},{"old":"/admin/pages/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.pages_create.render']['types'],
  },
  'admin.pages_create.execute': {
    methods: ["POST"],
    pattern: '/admin/pages/create',
    tokens: [{"old":"/admin/pages/create","type":0,"val":"admin","end":""},{"old":"/admin/pages/create","type":0,"val":"pages","end":""},{"old":"/admin/pages/create","type":0,"val":"create","end":""}],
    types: placeholder as Registry['admin.pages_create.execute']['types'],
  },
  'admin.pages_show.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages/:id',
    tokens: [{"old":"/admin/pages/:id","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.pages_show.render']['types'],
  },
  'admin.pages_update.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages/:id/edit',
    tokens: [{"old":"/admin/pages/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/edit","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.pages_update.render']['types'],
  },
  'admin.pages_update.execute': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/edit',
    tokens: [{"old":"/admin/pages/:id/edit","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/edit","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/edit","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/edit","type":0,"val":"edit","end":""}],
    types: placeholder as Registry['admin.pages_update.execute']['types'],
  },
  'admin.pages_update.publish': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/publish',
    tokens: [{"old":"/admin/pages/:id/publish","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/publish","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/publish","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/publish","type":0,"val":"publish","end":""}],
    types: placeholder as Registry['admin.pages_update.publish']['types'],
  },
  'admin.pages_update.unpublish': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/unpublish',
    tokens: [{"old":"/admin/pages/:id/unpublish","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/unpublish","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/unpublish","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/unpublish","type":0,"val":"unpublish","end":""}],
    types: placeholder as Registry['admin.pages_update.unpublish']['types'],
  },
  'admin.pages.set_homepage': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/homepage',
    tokens: [{"old":"/admin/pages/:id/homepage","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/homepage","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/homepage","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/homepage","type":0,"val":"homepage","end":""}],
    types: placeholder as Registry['admin.pages.set_homepage']['types'],
  },
  'admin.pages.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/pages/:id',
    tokens: [{"old":"/admin/pages/:id","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.pages.destroy']['types'],
  },
  'admin.page_translations.execute': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/translations',
    tokens: [{"old":"/admin/pages/:id/translations","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/translations","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/translations","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/translations","type":0,"val":"translations","end":""}],
    types: placeholder as Registry['admin.page_translations.execute']['types'],
  },
  'admin.page_revisions.index': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages/:id/translations/:translationId/revisions',
    tokens: [{"old":"/admin/pages/:id/translations/:translationId/revisions","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions","type":0,"val":"translations","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions","type":1,"val":"translationId","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions","type":0,"val":"revisions","end":""}],
    types: placeholder as Registry['admin.page_revisions.index']['types'],
  },
  'admin.page_revisions.restore': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore',
    tokens: [{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":0,"val":"translations","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":1,"val":"translationId","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":0,"val":"revisions","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":1,"val":"revisionId","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/restore","type":0,"val":"restore","end":""}],
    types: placeholder as Registry['admin.page_revisions.restore']['types'],
  },
  'admin.page_revisions.toggle_keep': {
    methods: ["POST"],
    pattern: '/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep',
    tokens: [{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":0,"val":"admin","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":0,"val":"pages","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":1,"val":"id","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":0,"val":"translations","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":1,"val":"translationId","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":0,"val":"revisions","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":1,"val":"revisionId","end":""},{"old":"/admin/pages/:id/translations/:translationId/revisions/:revisionId/keep","type":0,"val":"keep","end":""}],
    types: placeholder as Registry['admin.page_revisions.toggle_keep']['types'],
  },
  'admin.pages_preview.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/pages/preview/:pageId',
    tokens: [{"old":"/admin/pages/preview/:pageId","type":0,"val":"admin","end":""},{"old":"/admin/pages/preview/:pageId","type":0,"val":"pages","end":""},{"old":"/admin/pages/preview/:pageId","type":0,"val":"preview","end":""},{"old":"/admin/pages/preview/:pageId","type":1,"val":"pageId","end":""}],
    types: placeholder as Registry['admin.pages_preview.render']['types'],
  },
  'admin.templates.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/templates',
    tokens: [{"old":"/admin/templates","type":0,"val":"admin","end":""},{"old":"/admin/templates","type":0,"val":"templates","end":""}],
    types: placeholder as Registry['admin.templates.render']['types'],
  },
  'admin.templates.execute': {
    methods: ["POST"],
    pattern: '/admin/templates',
    tokens: [{"old":"/admin/templates","type":0,"val":"admin","end":""},{"old":"/admin/templates","type":0,"val":"templates","end":""}],
    types: placeholder as Registry['admin.templates.execute']['types'],
  },
  'admin.templates.create_from_page': {
    methods: ["POST"],
    pattern: '/admin/templates/from-page',
    tokens: [{"old":"/admin/templates/from-page","type":0,"val":"admin","end":""},{"old":"/admin/templates/from-page","type":0,"val":"templates","end":""},{"old":"/admin/templates/from-page","type":0,"val":"from-page","end":""}],
    types: placeholder as Registry['admin.templates.create_from_page']['types'],
  },
  'admin.templates.apply_to_page': {
    methods: ["POST"],
    pattern: '/admin/templates/:id/apply',
    tokens: [{"old":"/admin/templates/:id/apply","type":0,"val":"admin","end":""},{"old":"/admin/templates/:id/apply","type":0,"val":"templates","end":""},{"old":"/admin/templates/:id/apply","type":1,"val":"id","end":""},{"old":"/admin/templates/:id/apply","type":0,"val":"apply","end":""}],
    types: placeholder as Registry['admin.templates.apply_to_page']['types'],
  },
  'admin.templates.update': {
    methods: ["PUT"],
    pattern: '/admin/templates/:id',
    tokens: [{"old":"/admin/templates/:id","type":0,"val":"admin","end":""},{"old":"/admin/templates/:id","type":0,"val":"templates","end":""},{"old":"/admin/templates/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.templates.update']['types'],
  },
  'admin.templates.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/templates/:id',
    tokens: [{"old":"/admin/templates/:id","type":0,"val":"admin","end":""},{"old":"/admin/templates/:id","type":0,"val":"templates","end":""},{"old":"/admin/templates/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.templates.destroy']['types'],
  },
  'admin.files.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/files',
    tokens: [{"old":"/admin/files","type":0,"val":"admin","end":""},{"old":"/admin/files","type":0,"val":"files","end":""}],
    types: placeholder as Registry['admin.files.render']['types'],
  },
  'admin.files.upload': {
    methods: ["POST"],
    pattern: '/admin/files/upload',
    tokens: [{"old":"/admin/files/upload","type":0,"val":"admin","end":""},{"old":"/admin/files/upload","type":0,"val":"files","end":""},{"old":"/admin/files/upload","type":0,"val":"upload","end":""}],
    types: placeholder as Registry['admin.files.upload']['types'],
  },
  'admin.files.move': {
    methods: ["POST"],
    pattern: '/admin/files/:id/move',
    tokens: [{"old":"/admin/files/:id/move","type":0,"val":"admin","end":""},{"old":"/admin/files/:id/move","type":0,"val":"files","end":""},{"old":"/admin/files/:id/move","type":1,"val":"id","end":""},{"old":"/admin/files/:id/move","type":0,"val":"move","end":""}],
    types: placeholder as Registry['admin.files.move']['types'],
  },
  'admin.files.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/files/:id',
    tokens: [{"old":"/admin/files/:id","type":0,"val":"admin","end":""},{"old":"/admin/files/:id","type":0,"val":"files","end":""},{"old":"/admin/files/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.files.destroy']['types'],
  },
  'admin.files.upsert_alt': {
    methods: ["POST"],
    pattern: '/admin/files/:id/alts',
    tokens: [{"old":"/admin/files/:id/alts","type":0,"val":"admin","end":""},{"old":"/admin/files/:id/alts","type":0,"val":"files","end":""},{"old":"/admin/files/:id/alts","type":1,"val":"id","end":""},{"old":"/admin/files/:id/alts","type":0,"val":"alts","end":""}],
    types: placeholder as Registry['admin.files.upsert_alt']['types'],
  },
  'admin.files.delete_alt': {
    methods: ["DELETE"],
    pattern: '/admin/files/:id/alts',
    tokens: [{"old":"/admin/files/:id/alts","type":0,"val":"admin","end":""},{"old":"/admin/files/:id/alts","type":0,"val":"files","end":""},{"old":"/admin/files/:id/alts","type":1,"val":"id","end":""},{"old":"/admin/files/:id/alts","type":0,"val":"alts","end":""}],
    types: placeholder as Registry['admin.files.delete_alt']['types'],
  },
  'admin.file_folders.render': {
    methods: ["GET","HEAD"],
    pattern: '/admin/files/folders',
    tokens: [{"old":"/admin/files/folders","type":0,"val":"admin","end":""},{"old":"/admin/files/folders","type":0,"val":"files","end":""},{"old":"/admin/files/folders","type":0,"val":"folders","end":""}],
    types: placeholder as Registry['admin.file_folders.render']['types'],
  },
  'admin.file_folders.execute': {
    methods: ["POST"],
    pattern: '/admin/files/folders',
    tokens: [{"old":"/admin/files/folders","type":0,"val":"admin","end":""},{"old":"/admin/files/folders","type":0,"val":"files","end":""},{"old":"/admin/files/folders","type":0,"val":"folders","end":""}],
    types: placeholder as Registry['admin.file_folders.execute']['types'],
  },
  'admin.file_folders.update': {
    methods: ["PUT"],
    pattern: '/admin/files/folders/:id',
    tokens: [{"old":"/admin/files/folders/:id","type":0,"val":"admin","end":""},{"old":"/admin/files/folders/:id","type":0,"val":"files","end":""},{"old":"/admin/files/folders/:id","type":0,"val":"folders","end":""},{"old":"/admin/files/folders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.file_folders.update']['types'],
  },
  'admin.file_folders.destroy': {
    methods: ["DELETE"],
    pattern: '/admin/files/folders/:id',
    tokens: [{"old":"/admin/files/folders/:id","type":0,"val":"admin","end":""},{"old":"/admin/files/folders/:id","type":0,"val":"files","end":""},{"old":"/admin/files/folders/:id","type":0,"val":"folders","end":""},{"old":"/admin/files/folders/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['admin.file_folders.destroy']['types'],
  },
  'api.theme.execute': {
    methods: ["POST"],
    pattern: '/api/settings/preferences/theme',
    tokens: [{"old":"/api/settings/preferences/theme","type":0,"val":"api","end":""},{"old":"/api/settings/preferences/theme","type":0,"val":"settings","end":""},{"old":"/api/settings/preferences/theme","type":0,"val":"preferences","end":""},{"old":"/api/settings/preferences/theme","type":0,"val":"theme","end":""}],
    types: placeholder as Registry['api.theme.execute']['types'],
  },
  'api.admin.builder_operations.execute': {
    methods: ["POST"],
    pattern: '/api/admin/builder/operations',
    tokens: [{"old":"/api/admin/builder/operations","type":0,"val":"api","end":""},{"old":"/api/admin/builder/operations","type":0,"val":"admin","end":""},{"old":"/api/admin/builder/operations","type":0,"val":"builder","end":""},{"old":"/api/admin/builder/operations","type":0,"val":"operations","end":""}],
    types: placeholder as Registry['api.admin.builder_operations.execute']['types'],
  },
  'api.admin.builder_operations.presence': {
    methods: ["GET","HEAD"],
    pattern: '/api/admin/builder/presence/:translationId',
    tokens: [{"old":"/api/admin/builder/presence/:translationId","type":0,"val":"api","end":""},{"old":"/api/admin/builder/presence/:translationId","type":0,"val":"admin","end":""},{"old":"/api/admin/builder/presence/:translationId","type":0,"val":"builder","end":""},{"old":"/api/admin/builder/presence/:translationId","type":0,"val":"presence","end":""},{"old":"/api/admin/builder/presence/:translationId","type":1,"val":"translationId","end":""}],
    types: placeholder as Registry['api.admin.builder_operations.presence']['types'],
  },
  'api.admin.builder_operations.save_draft': {
    methods: ["POST"],
    pattern: '/api/admin/builder/draft/:translationId',
    tokens: [{"old":"/api/admin/builder/draft/:translationId","type":0,"val":"api","end":""},{"old":"/api/admin/builder/draft/:translationId","type":0,"val":"admin","end":""},{"old":"/api/admin/builder/draft/:translationId","type":0,"val":"builder","end":""},{"old":"/api/admin/builder/draft/:translationId","type":0,"val":"draft","end":""},{"old":"/api/admin/builder/draft/:translationId","type":1,"val":"translationId","end":""}],
    types: placeholder as Registry['api.admin.builder_operations.save_draft']['types'],
  },
  'api.admin.pages_preview.token': {
    methods: ["GET","HEAD"],
    pattern: '/api/admin/page/preview/token',
    tokens: [{"old":"/api/admin/page/preview/token","type":0,"val":"api","end":""},{"old":"/api/admin/page/preview/token","type":0,"val":"admin","end":""},{"old":"/api/admin/page/preview/token","type":0,"val":"page","end":""},{"old":"/api/admin/page/preview/token","type":0,"val":"preview","end":""},{"old":"/api/admin/page/preview/token","type":0,"val":"token","end":""}],
    types: placeholder as Registry['api.admin.pages_preview.token']['types'],
  },
  'api.admin.file.list': {
    methods: ["GET","HEAD"],
    pattern: '/api/admin/files',
    tokens: [{"old":"/api/admin/files","type":0,"val":"api","end":""},{"old":"/api/admin/files","type":0,"val":"admin","end":""},{"old":"/api/admin/files","type":0,"val":"files","end":""}],
    types: placeholder as Registry['api.admin.file.list']['types'],
  },
  'api.admin.file.find': {
    methods: ["GET","HEAD"],
    pattern: '/api/admin/files/:id',
    tokens: [{"old":"/api/admin/files/:id","type":0,"val":"api","end":""},{"old":"/api/admin/files/:id","type":0,"val":"admin","end":""},{"old":"/api/admin/files/:id","type":0,"val":"files","end":""},{"old":"/api/admin/files/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['api.admin.file.find']['types'],
  },
  'contact.execute': {
    methods: ["POST"],
    pattern: '/contact',
    tokens: [{"old":"/contact","type":0,"val":"contact","end":""}],
    types: placeholder as Registry['contact.execute']['types'],
  },
  'page.sitemap': {
    methods: ["GET","HEAD"],
    pattern: '/sitemap.xml',
    tokens: [{"old":"/sitemap.xml","type":0,"val":"sitemap.xml","end":""}],
    types: placeholder as Registry['page.sitemap']['types'],
  },
  'page.robots': {
    methods: ["GET","HEAD"],
    pattern: '/robots.txt',
    tokens: [{"old":"/robots.txt","type":0,"val":"robots.txt","end":""}],
    types: placeholder as Registry['page.robots']['types'],
  },
  'page.home': {
    methods: ["GET","HEAD"],
    pattern: '/',
    tokens: [{"old":"/","type":0,"val":"/","end":""}],
    types: placeholder as Registry['page.home']['types'],
  },
  'page.localised.render': {
    methods: ["GET","HEAD"],
    pattern: '/:locale/:slug',
    tokens: [{"old":"/:locale/:slug","type":1,"val":"locale","end":""},{"old":"/:locale/:slug","type":1,"val":"slug","end":""}],
    types: placeholder as Registry['page.localised.render']['types'],
  },
  'page.render': {
    methods: ["GET","HEAD"],
    pattern: '/:slug',
    tokens: [{"old":"/:slug","type":1,"val":"slug","end":""}],
    types: placeholder as Registry['page.render']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
