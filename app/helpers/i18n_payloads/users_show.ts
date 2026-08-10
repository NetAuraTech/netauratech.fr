import type { I18nService } from '#services/i18n_service'
import type Role from '#models/auth/role'
import type Permission from '#models/auth/permission'
import type { TranslationNodes } from '#types/translations'

export function buildUsersShowPayload(i18n: I18nService, role: Role, permissions: Permission[]) {
  return i18n.buildPayload({
    title: 'admin.users.list.title',
    info: {
      email: 'admin.users.show.info.email',
      username: 'admin.users.show.info.username',
      value: 'admin.users.show.info.value',
    },
    history: {
      created_at: 'admin.users.show.history.created_at',
      updated_at: 'admin.users.show.history.updated_at',
      verified_at: 'admin.users.show.history.verified_at',
      value: 'admin.users.show.history.value',
    },
    providers: {
      connected: 'admin.users.show.providers.connected',
      not_connected: 'admin.users.show.providers.not_connected',
      value: 'admin.users.show.providers.value',
    },
    status: {
      verified: 'admin.users.status.verified',
      unverified: 'admin.users.status.unverified',
      pending_invite: 'admin.users.status.pending_invite',
    },
    actions: {
      edit: i18n.entry('admin.users.edit.title', { username: '{username}' }),
      delete: i18n.entry('admin.users.delete.title', { username: '{username}' }),
    },
    roles: {
      value: 'admin.users.show.role.value',
      current: 'admin.users.show.role.current',
      ...[role].reduce((acc, r) => {
        acc[r.slug] = {
          value: `roles.${r.slug}.value`,
          description: `roles.${r.slug}.description`,
        }
        return acc
      }, {} as TranslationNodes),
    },
    permissions: {
      value: i18n.entry('admin.users.show.permission.value', { amount: '{amount}' }),
      ...permissions.reduce(
        (acc, permission) => {
          const [section, action] = permission.slug.split('.')

          if (!acc.category[section]) {
            acc.category[section] = `admin.users.permissions.category.${section}`
          }

          if (!acc[section]) acc[section] = {}
          acc[section][action] = {
            value: `admin.users.permissions.${section}.${action}.value`,
          }

          return acc
        },
        { category: {} } as { category: Record<string, string>; [key: string]: any }
      ),
    },
  })
}
