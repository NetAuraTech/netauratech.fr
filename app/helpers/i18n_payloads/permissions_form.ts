import type { I18nService } from '#services/i18n_service'

/**
 * Builds the translation payload for the permission create/edit form.
 */
export function buildPermissionsFormPayload(i18n: I18nService) {
  return i18n.buildPayload({
    title: {
      create: 'admin.permissions.create.title',
      edit: i18n.entry('admin.permissions.edit.title', { name: '{name}' }),
    },
    name: {
      value: 'admin.permissions.form.name.value',
      placeholder: 'admin.permissions.form.name.placeholder',
    },
    slug: {
      value: 'admin.permissions.form.slug.value',
      placeholder: 'admin.permissions.form.slug.placeholder',
    },
    category: {
      value: 'admin.permissions.form.category.value',
      placeholder: 'admin.permissions.form.category.placeholder',
    },
    description: {
      value: 'admin.permissions.form.description.value',
      placeholder: 'admin.permissions.form.description.placeholder',
    },
    submit: 'admin.permissions.form.submit',
    actions: {
      list: 'admin.permissions.list.title',
    },
  })
}
