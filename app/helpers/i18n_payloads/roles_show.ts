import type { I18nService } from '#services/i18n_service'
import type Role from '#models/auth/role'
import type Permission from '#models/auth/permission'
import type { TranslationNodes } from '#types/translations'
import { nestTranslation, permissionCategoryKey } from '#helpers/i18n_payloads/nest'

/**
 * Builds the translation payload for the role detail page.
 *
 * Includes the role display name (`roles.{slug...}`), per-permission entries
 * nested by slug and per-category labels so the frontend can show the
 * permission matrix grouped by category. Leaves are the raw stored values —
 * system records store i18n keys resolved by the `roles` / `permissions` lang
 * namespaces, custom records store plain strings returned unchanged.
 */
export function buildRolesShowPayload(i18n: I18nService, role: Role, permissions: Permission[]) {
  const categories: TranslationNodes = {}
  const items: TranslationNodes = {}

  for (const permission of permissions) {
    nestTranslation(categories, permissionCategoryKey(permission.category), permission.category)
    nestTranslation(items, permission.slug, {
      value: permission.name,
      description: permission.description ?? '',
    })
  }

  const roleEntry: TranslationNodes = {}
  nestTranslation(roleEntry, role.slug, {
    value: role.name,
    description: role.description ?? '',
  })

  return i18n.buildPayload({
    title: i18n.entry('admin.roles.show.title', { name: '{name}' }),
    name: { value: 'admin.roles.form.name.value' },
    slug: { value: 'admin.roles.form.slug.value' },
    description: { value: 'admin.roles.form.description.value' },
    system: {
      value: 'admin.roles.system.value',
      hint: 'admin.roles.system.hint',
    },
    users: {
      value: 'admin.roles.users.value',
      empty: 'admin.roles.users.empty',
      table: {
        username: 'admin.roles.users.table.username',
        email: 'admin.roles.users.table.email',
      },
      actions: 'admin.roles.actions',
      show: i18n.entry('admin.users.show.title', { username: '{username}' }),
    },
    permissions: {
      value: 'admin.roles.form.permissions.value',
      categories,
      items,
    },
    actions: {
      list: 'admin.roles.list.title',
      edit: i18n.entry('admin.roles.edit.title', { name: '{name}' }),
      delete: i18n.entry('admin.roles.delete.title', { name: '{name}' }),
    },
    delete: {
      confirm: i18n.entry('admin.roles.delete.confirm', { name: '{name}' }),
    },
    roles: roleEntry,
  })
}
