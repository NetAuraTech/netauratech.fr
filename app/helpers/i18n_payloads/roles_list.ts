import type { I18nService } from '#services/i18n_service'
import type Role from '#models/auth/role'
import type { TranslationNodes } from '#types/translations'
import { nestTranslation } from '#helpers/i18n_payloads/nest'

/**
 * Builds the translation payload for the roles listing page.
 *
 * Includes one `roles.{slug...}` entry per role (system or custom). Leaves are
 * the raw stored values: system roles store i18n keys (`roles.admin.value`)
 * resolved by the `roles` lang namespace, while custom roles store plain
 * strings which `i18n.t()` returns unchanged.
 */
export function buildRolesListPayload(i18n: I18nService, roles: Role[]) {
  const roleEntries: TranslationNodes = {}

  for (const role of roles) {
    nestTranslation(roleEntries, role.slug, {
      value: role.name,
      description: role.description ?? '',
    })
  }

  return i18n.buildPayload({
    title: 'admin.roles.list.title',
    search: {
      value: 'admin.roles.search.value',
      placeholder: 'admin.roles.search.placeholder',
      filter: 'admin.roles.search.filter',
    },
    create: { title: 'admin.roles.create.title' },
    table: {
      name: 'admin.roles.table.name',
      slug: 'admin.roles.table.slug',
      permissions: 'admin.roles.table.permissions',
      users: 'admin.roles.table.users',
    },
    actions: {
      value: 'admin.roles.actions',
      show: i18n.entry('admin.roles.show.title', { name: '{name}' }),
      edit: i18n.entry('admin.roles.edit.title', { name: '{name}' }),
      delete: i18n.entry('admin.roles.delete.title', { name: '{name}' }),
    },
    delete: {
      confirm: i18n.entry('admin.roles.delete.confirm', { name: '{name}' }),
    },
    system: {
      value: 'admin.roles.system.value',
      hint: 'admin.roles.system.hint',
    },
    empty: 'admin.roles.empty',
    roles: roleEntries,
  })
}
