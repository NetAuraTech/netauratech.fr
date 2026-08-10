import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { Data } from '@generated/data'
import { Paginated } from '~/types/paginated'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { useMenu } from '~/hooks/use_admin'
import { CanAccess } from '~/guards/can_access'
import { Card } from '~/components/atoms/card'
import { Badge } from '~/components/atoms/badge'
import { Button } from '~/components/atoms/button'
import { Icon } from '~/components/atoms/icon'
import { Field } from '~/components/molecules/field'
import { Pagination } from '~/components/molecules/pagination'
import Table from '~/components/atoms/table/table'
import { useTranslation } from '~/hooks/use_translation'
import type { AdminRolesIndexTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

type PageProps = {
  roles: Paginated<Data.Role>
  filters: {
    search?: string
  }
  translations: AdminRolesIndexTranslations
}

export default function RolesIndexPage(props: PageProps) {
  const { roles, filters, translations } = props
  const { t } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  return (
    <AdminMain
      title={t('title')}
      icon={getEntryIcon('admin.roles.render')}
      action={
        <CanAccess permission="roles.create">
          <Button route="admin.roles_create.render" variant="secondary" fitContent>
            {t('create.title')}
          </Button>
        </CanAccess>
      }
    >
      <Card
        header={
          <Form
            route="admin.roles.render"
            className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end"
          >
            <Field
              type="text"
              name="search"
              label={t('search.value')}
              placeholder={t('search.placeholder')}
              defaultValue={filters.search}
              sanitize
            />
            <Button type="submit" fitContent>
              {t('search.filter')}
            </Button>
          </Form>
        }
        footer={
          <Pagination route="admin.roles.render" filters={filters} metadata={roles.metadata} />
        }
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('table.name')}</Table.HeaderCell>
              <Table.HeaderCell>{t('table.slug')}</Table.HeaderCell>
              <Table.HeaderCell>{t('table.permissions')}</Table.HeaderCell>
              <Table.HeaderCell>{t('table.users')}</Table.HeaderCell>
              <Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {roles.data.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center! p-12!">
                  {t('empty')}
                </Table.Cell>
              </Table.Row>
            ) : (
              roles.data.map((role: Data.Role) => (
                <Table.Row key={`role-${role.id}`}>
                  <Table.Cell data-label={t('table.name')}>
                    <div className="grid">
                      <span className="flex items-center gap-2">
                        {t(`roles.${role.slug}.value` as any)}
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
                  </Table.Cell>
                  <Table.Cell data-label={t('table.slug')}>{role.slug}</Table.Cell>
                  <Table.Cell data-label={t('table.permissions')}>
                    {role.permissions?.length ?? 0}
                  </Table.Cell>
                  <Table.Cell data-label={t('table.users')}>{role.usersCount ?? 0}</Table.Cell>
                  <Table.Cell data-label={t('actions.value')}>
                    <div className="flex items-center w-full py-4 gap-2">
                      <CanAccess permission="roles.view">
                        <Button
                          variant="icon_info"
                          route="admin.roles_show.render"
                          routeParams={{ id: role.id }}
                          title={t('actions.show', { name: t(`roles.${role.slug}.value` as any) })}
                          fitContent
                        >
                          <Icon name="Eye" size={18} />
                        </Button>
                      </CanAccess>
                      {!role.isSystem && (
                        <>
                          <CanAccess permission="roles.update">
                            <Button
                              variant="icon_warning"
                              route="admin.roles_update.render"
                              routeParams={{ id: role.id }}
                              title={t('actions.edit', {
                                name: t(`roles.${role.slug}.value` as any),
                              })}
                              fitContent
                            >
                              <Icon name="Pen" size={18} />
                            </Button>
                          </CanAccess>
                          <CanAccess permission="roles.delete">
                            <Form
                              onBefore={() => {
                                return window.confirm(
                                  t('delete.confirm', {
                                    name: t(`roles.${role.slug}.value` as any),
                                  })
                                )
                              }}
                              route="admin.roles.destroy"
                              routeParams={{ id: role.id }}
                            >
                              <Button
                                variant="icon_danger"
                                title={t('actions.delete', {
                                  name: t(`roles.${role.slug}.value` as any),
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
    </AdminMain>
  )
}

RolesIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
