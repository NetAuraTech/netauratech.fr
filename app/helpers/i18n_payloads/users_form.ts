import type { I18nService } from '#services/i18n_service'
import type Role from '#models/auth/role'
import type { TranslationNodes } from '#types/translations'

export function buildUsersFormPayload(i18n: I18nService, roles: Role[]) {
  return i18n.buildPayload({
    title: {
      create: 'admin.users.create.title',
      edit: i18n.entry('admin.users.edit.title', { username: '{username}' }),
    },
    email: {
      value: 'admin.users.form.email.value',
      placeholder: 'admin.users.form.email.placeholder',
    },
    username: {
      value: 'admin.users.form.username.value',
      placeholder: 'admin.users.form.username.placeholder',
    },
    roles: {
      value: 'admin.users.form.role.value',
      placeholder: 'admin.users.form.role.placeholder',
      ...roles.reduce((acc, role) => {
        acc[role.slug] = {
          value: `roles.${role.slug}.value`,
          description: `roles.${role.slug}.description`,
        }
        return acc
      }, {} as TranslationNodes),
    },
    submit: 'admin.users.form.submit',
    actions: {
      list: 'admin.users.list.title',
    },
  })
}
