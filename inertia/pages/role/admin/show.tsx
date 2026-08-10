import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { Data } from '@generated/data'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { useMenu } from '~/hooks/use_admin'
import { CanAccess } from '~/guards/can_access'
import { Card } from '~/components/atoms/card'
import { Badge } from '~/components/atoms/badge'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'
import { Heading } from '~/components/atoms/heading'
import { Separator } from '~/components/atoms/separator'
import Table from '~/components/atoms/table/table'
import { useTranslation } from '~/hooks/use_translation'
import { permissionCategoryKey } from '~/helpers/permissions'
import type { AdminRolesShowTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  role: Data.Role
  translations: AdminRolesShowTranslations
}

export default function RolesShowPage(props: PageProps) {
  const { role, translations } = props
  const { t } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  const roleName = t(`roles.${role.slug}.value` as any)

  const permissionsByCategory = (role.permissions ?? []).reduce<Record<string, Data.Permission[]>>(
    (acc, permission) => {
      const category = permissionCategoryKey(permission.category)
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(permission)
      return acc
    },
    {}
  )

  return (
    <AdminMain title={t('title', { name: roleName })} icon={getEntryIcon('admin.roles.render')}>
      <Card
        header={
          <div className="flex items-center justify-between gap-3">
            <CanAccess permission="roles.view">
              <Button
                variant="icon"
                route="admin.roles.render"
                title={t('actions.list')}
                fitContent
              >
                <Icon name="ArrowLeft" />
              </Button>
            </CanAccess>
            {!role.isSystem && (
              <div className="flex gap-3">
                <CanAccess permission="roles.update">
                  <Button
                    variant="icon_warning"
                    route="admin.roles_update.render"
                    routeParams={{ id: role.id }}
                    title={t('actions.edit', { name: roleName })}
                    fitContent
                  >
                    <Icon name="Pen" size={18} />
                  </Button>
                </CanAccess>
                <CanAccess permission="roles.delete">
                  <Form
                    onBefore={() => {
                      return window.confirm(t('delete.confirm', { name: roleName }))
                    }}
                    route="admin.roles.destroy"
                    routeParams={{ id: role.id }}
                  >
                    <Button
                      variant="icon_danger"
                      title={t('actions.delete', { name: roleName })}
                      fitContent
                    >
                      <Icon name="Trash" size={18} />
                    </Button>
                  </Form>
                </CanAccess>
              </div>
            )}
          </div>
        }
      >
        <div className="grid gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
            <div className="grid gap-3">
              <Heading level={3}>{t('name.value')}</Heading>
              <Separator />
              <div className="grid">
                <span className="flex items-center gap-2">
                  {roleName}
                  {role.isSystem && (
                    <Badge variant="info" title={t('system.hint')}>
                      {t('system.value')}
                    </Badge>
                  )}
                </span>
                <span className="text-xs text-ink-muted">
                  {t(`roles.${role.slug}.description` as any)}
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              <Heading level={3}>{t('slug.value')}</Heading>
              <Separator />
              <span>{role.slug}</span>
            </div>
          </div>

          <div className="grid gap-3">
            <Heading level={3}>{t('permissions.value')}</Heading>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
              {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
                <div key={`category-${category}`} className="grid gap-2">
                  <span className="font-semibold">
                    {t(`permissions.categories.${category}` as any)}
                  </span>
                  <ul className="grid gap-1">
                    {categoryPermissions.map((permission) => (
                      <li
                        key={`permission-${permission.id}`}
                        title={t(`permissions.items.${permission.slug}.description` as any)}
                      >
                        {t(`permissions.items.${permission.slug}.value` as any)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3">
            <Heading level={3}>{t('users.value')}</Heading>
            <Separator />
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('users.table.username')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('users.table.email')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('users.actions')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(role.users ?? []).length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={3} className="text-center! p-12!">
                      {t('users.empty')}
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  (role.users ?? []).map((user) => (
                    <Table.Row key={`user-${user.id}`}>
                      <Table.Cell data-label={t('users.table.username')}>
                        {user.username}
                      </Table.Cell>
                      <Table.Cell data-label={t('users.table.email')}>{user.email}</Table.Cell>
                      <Table.Cell data-label={t('users.actions')}>
                        <div className="flex items-center w-full py-4 gap-2">
                          <CanAccess permission="users.view">
                            <Button
                              variant="icon_info"
                              route="admin.users_show.render"
                              routeParams={{ id: user.id }}
                              title={t('users.show', { username: user.username })}
                              fitContent
                            >
                              <Icon name="Eye" size={18} />
                            </Button>
                          </CanAccess>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </div>
        </div>
      </Card>
    </AdminMain>
  )
}

RolesShowPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
