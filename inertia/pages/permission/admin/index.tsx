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
import Table from '~/components/atoms/table/table'
import { useTranslation } from '~/hooks/use_translation'
import { permissionCategoryKey } from '~/helpers/permissions'
import type { AdminPermissionsIndexTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  permissions: Data.Permission[]
  translations: AdminPermissionsIndexTranslations
}

export default function PermissionsIndexPage(props: PageProps) {
  const { permissions, translations } = props
  const { t } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  const permissionsByCategory = permissions.reduce<Record<string, Data.Permission[]>>(
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
    <AdminMain
      title={t('title')}
      icon={getEntryIcon('admin.permissions.render')}
      action={
        <CanAccess permission="permissions.create">
          <Button route="admin.permissions_create.render" variant="secondary" fitContent>
            {t('create.title')}
          </Button>
        </CanAccess>
      }
    >
      <div className="grid gap-6">
        {Object.entries(permissionsByCategory).map(([category, categoryPermissions]) => (
          <Card key={`category-${category}`} title={t(`categories.${category}` as any)}>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>{t('table.name')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.slug')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('table.description')}</Table.HeaderCell>
                  <Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {categoryPermissions.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={4} className="text-center! p-12!">
                      {t('empty')}
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  categoryPermissions.map((permission: Data.Permission) => (
                    <Table.Row key={`permission-${permission.id}`}>
                      <Table.Cell data-label={t('table.name')}>
                        <div className="flex items-center gap-2">
                          <span>{t(`items.${permission.slug}.value` as any)}</span>
                          {permission.isSystem && (
                            <Badge variant="info" title={t('system.hint')}>
                              {t('system.value')}
                            </Badge>
                          )}
                        </div>
                      </Table.Cell>
                      <Table.Cell data-label={t('table.slug')}>{permission.slug}</Table.Cell>
                      <Table.Cell data-label={t('table.description')}>
                        {t(`items.${permission.slug}.description` as any)}
                      </Table.Cell>
                      <Table.Cell data-label={t('actions.value')}>
                        <div className="flex items-center w-full py-4 gap-2">
                          {!permission.isSystem && (
                            <>
                              <CanAccess permission="permissions.update">
                                <Button
                                  variant="icon_warning"
                                  route="admin.permissions_update.render"
                                  routeParams={{ id: permission.id }}
                                  title={t('actions.edit', {
                                    name: t(`items.${permission.slug}.value` as any),
                                  })}
                                  fitContent
                                >
                                  <Icon name="Pen" size={18} />
                                </Button>
                              </CanAccess>
                              <CanAccess permission="permissions.delete">
                                <Form
                                  onBefore={() => {
                                    return window.confirm(
                                      t('delete.confirm', {
                                        name: t(`items.${permission.slug}.value` as any),
                                      })
                                    )
                                  }}
                                  route="admin.permissions.destroy"
                                  routeParams={{ id: permission.id }}
                                >
                                  <Button
                                    variant="icon_danger"
                                    title={t('actions.delete', {
                                      name: t(`items.${permission.slug}.value` as any),
                                    })}
                                    fitContent
                                  >
                                    <Icon name="Trash" size={18} />
                                  </Button>
                                </Form>
                              </CanAccess>
                            </>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table>
          </Card>
        ))}
      </div>
    </AdminMain>
  )
}

PermissionsIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
