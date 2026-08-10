import type { I18nService } from '#services/i18n_service'
import type Role from '#models/auth/role'
import type { TranslationNodes } from '#types/translations'

export function buildUsersListPayload(i18n: I18nService, roles: Role[]) {
  return i18n.buildPayload({
    title: 'admin.users.list.title',
    action: 'admin.users.list.action',
    search: {
      value: 'admin.users.search.value',
      placeholder: 'admin.users.search.placeholder',
      filter: 'admin.users.search.filter',
    },
    roles: {
      value: 'admin.users.roles.value',
      placeholder: 'admin.users.roles.placeholder',
      ...roles.reduce((acc, role) => {
        acc[role.slug] = {
          value: `roles.${role.slug}.value`,
          description: `roles.${role.slug}.description`,
        }
        return acc
      }, {} as TranslationNodes),
    },
    status: {
      verified: 'admin.users.status.verified',
      unverified: 'admin.users.status.unverified',
      pending_invite: 'admin.users.status.pending_invite',
      value: 'admin.users.status.value',
    },
    empty: 'admin.users.list.empty',
    register_on: 'admin.users.list.register_on',
    value: 'admin.users.value',
    value_one: 'admin.users.value_one',
    actions: {
      value: 'admin.users.actions',
      show: i18n.entry('admin.users.show.title', { username: '{username}' }),
      edit: i18n.entry('admin.users.edit.title', { username: '{username}' }),
      delete: i18n.entry('admin.users.delete.title', { username: '{username}' }),
    },
  })
}
