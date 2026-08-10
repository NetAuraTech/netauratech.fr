import type { I18nService } from '#services/i18n_service'

export function buildFileFoldersPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'admin.folders.list.title',
    action: 'admin.files.list.title',
    browse: 'admin.folders.list.browse',
    help: 'admin.folders.form.help',
    name: {
      root: 'admin.folders.form.name.root',
      sub: 'admin.folders.form.name.sub',
    },
    empty: {
      value: 'admin.folders.list.empty.value',
      help: 'admin.folders.list.empty.help',
    },
    actions: {
      add: 'admin.folders.list.add',
      create: 'admin.folders.form.create',
      update: 'admin.folders.form.update',
      cancel: 'admin.folders.form.cancel',
      rename: 'admin.folders.list.rename',
      delete: {
        value: i18n.entry('admin.folders.delete.title', { folder: '{folder}' }),
        confirm: 'admin.folders.delete.confirm',
      },
    },
  })
}
