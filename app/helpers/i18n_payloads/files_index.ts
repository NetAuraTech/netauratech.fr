import type { I18nService } from '#services/i18n_service'

export function buildFilesIndexPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: 'admin.files.list.title',
    action: {
      folders: 'admin.files.list.action.folders',
      upload: 'admin.files.list.action.upload',
    },
    name: 'admin.files.form.name.value',
    type: 'admin.files.form.type.value',
    size: 'admin.files.form.size.value',
    uploaded_at: 'admin.files.form.uploaded_at.value',
    upload: {
      value: 'admin.files.upload.submit',
      help: 'admin.files.upload.help',
      remove: 'admin.files.upload.remove',
      max_size: i18n.entry('admin.files.upload.max_size', { size: '{size}' }),
      try_again: 'admin.files.upload.try_again',
      error: {
        size: i18n.entry('admin.files.upload.error.size', { max: '{max}' }),
      },
    },
    actions: {
      value: 'admin.files.actions',
      show: 'admin.files.show.title',
      delete: {
        value: i18n.entry('admin.files.delete.title', { filename: '{filename}' }),
        confirm: 'admin.files.delete.confirm',
      },
    },
    folders: {
      all: 'admin.files.list.folders.all',
    },
    search: {
      filter: 'admin.files.search.filter',
      value: 'admin.files.search.value',
      placeholder: 'admin.files.search.placeholder',
      type: {
        value: 'admin.files.search.type.value',
        options: {
          placeholder: 'admin.files.search.type.options.placeholder',
          image: 'admin.files.search.type.options.image',
          video: 'admin.files.search.type.options.video',
          audio: 'admin.files.search.type.options.audio',
          pdf: 'admin.files.search.type.options.pdf',
        },
      },
    },
    alts: {
      title: 'admin.files.show.alts.title',
      add: 'admin.files.show.alts.add',
      edit: 'admin.files.show.alts.edit',
      empty: 'admin.files.show.alts.empty',
      close: 'admin.files.show.alts.close',
      delete: {
        value: 'admin.files.show.alts.delete.value',
        confirm: 'admin.files.show.alts.delete.confirm',
      },
      form: {
        update: 'admin.files.show.alts.form.update',
        submit: 'admin.files.show.alts.form.submit',
        cancel: 'admin.files.show.alts.form.cancel',
        locale: {
          value: 'admin.files.show.alts.form.locale.value',
        },
        key: {
          value: 'admin.files.show.alts.form.key.value',
          placeholder: 'admin.files.show.alts.form.key.placeholder',
        },
        alt_text: {
          value: 'admin.files.show.alts.form.alt_text.value',
          placeholder: 'admin.files.show.alts.form.alt_text.placeholder',
        },
      },
    },
  })
}
