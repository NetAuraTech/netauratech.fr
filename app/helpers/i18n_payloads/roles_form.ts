import type { I18nService } from '#services/i18n_service'
import type Permission from '#models/auth/permission'
import type { TranslationNodes } from '#types/translations'
import { nestTranslation, permissionCategoryKey } from '#helpers/i18n_payloads/nest'

/**
 * Builds the translation payload for the role create/edit form.
 *
 * Includes per-permission entries nested by slug (`permissions.items.{...}`)
 * and per-category labels (`permissions.categories.{...}`) so the frontend can
 * group the checkboxes. Leaves are the raw stored values: system permissions
 * store i18n keys (`permissions.users.create.value`) resolved by the
 * `permissions` lang namespace, while custom permissions store plain strings
 * which `i18n.t()` returns unchanged.
 */
export function buildRolesFormPayload(i18n: I18nService, permissions: Permission[]) {
  const categories: TranslationNodes = {}
  const items: TranslationNodes = {}

  for (const permission of permissions) {
    nestTranslation(categories, permissionCategoryKey(permission.category), permission.category)
    nestTranslation(items, permission.slug, {
      value: permission.name,
      description: permission.description ?? '',
    })
  }

  return i18n.buildPayload({
    title: {
      create: 'admin.roles.create.title',
      edit: i18n.entry('admin.roles.edit.title', { name: '{name}' }),
    },
    name: {
      value: 'admin.roles.form.name.value',
      placeholder: 'admin.roles.form.name.placeholder',
    },
    slug: {
      value: 'admin.roles.form.slug.value',
      placeholder: 'admin.roles.form.slug.placeholder',
    },
    description: {
      value: 'admin.roles.form.description.value',
      placeholder: 'admin.roles.form.description.placeholder',
    },
    submit: 'admin.roles.form.submit',
    actions: {
      list: 'admin.roles.list.title',
    },
    permissions: {
      value: 'admin.roles.form.permissions.value',
      system_hint: 'admin.roles.form.permissions.system_hint',
      categories,
      items,
    },
  })
}
