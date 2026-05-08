import { ReactElement } from 'react'
import { Button } from '~/components/atoms/button'
import { Pagination } from '~/components/molecules/pagination'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Paginated } from '~/types/paginated'
import { Data } from '@generated/data'
import Layout from '~/layouts/admin'
import { useMenu } from '~/hooks/use_admin'
import { CanAccess } from '~/guards/can_access'
import { Card } from '~/components/atoms/card'
import Table from '~/components/atoms/table/table'
import { Icon } from '~/components/atoms/icon'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import type { PageStatus } from '#types/page'
import { locales, useTranslation } from '~/hooks/use_translation'
import type { CmsPagesIndexTranslations } from '#types/translations'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

interface Props {
  pages: Paginated<Data.Page>
  filters: {
    status?: string
    locale?: string
    search?: string
  }
  translations: CmsPagesIndexTranslations
}

const PAGE_STATUSES: PageStatus[] = ['draft', 'published', 'archived']

const statusesClass = {
  published: 'text-success border-success bg-success-soft',
  draft: 'text-secondary border-secondary bg-secondary-light/20',
  archived: 'text-warning border-warning bg-warning-soft',
} as const

export default function PagesIndexPage(props: Props) {
  const { pages, filters, translations } = props
  const { t } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  return (
    <>
      <AdminMain
        title={t('title')}
        icon={getEntryIcon('admin.pages.render')}
        action={
          <CanAccess permission="pages.create">
            <Button route="admin.pages_create.render" variant="secondary" fitContent>
              {t('action')}
            </Button>
          </CanAccess>
        }
      >
        <Card
          header={
            <Form
              route="admin.pages.render"
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
              <Field
                type="select"
                label={t(`locale.value`)}
                name="locale"
                placeholder={t(`locale.all`)}
                defaultValue={filters.locale}
                sanitize
              >
                {locales.map((l) => (
                  <SelectOption key={l} value={l} label={l.toUpperCase()} />
                ))}
              </Field>
              <Field
                type="select"
                label={t(`status.value`)}
                name="status"
                placeholder={t(`status.all`)}
                defaultValue={filters.status}
                sanitize
              >
                {PAGE_STATUSES.map((status) => (
                  <SelectOption
                    key={`status-${status}`}
                    value={status}
                    label={t(`status.${status}`)}
                  />
                ))}
              </Field>
              <Button type="submit" fitContent>
                {t('search.filter')}
              </Button>
            </Form>
          }
          footer={
            <Pagination route="admin.pages.render" filters={filters} metadata={pages.metadata} />
          }
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('page_title')}</Table.HeaderCell>
                <Table.HeaderCell>{t(`slug`)}</Table.HeaderCell>
                <Table.HeaderCell>{t(`status.value`)}</Table.HeaderCell>
                <Table.HeaderCell>{t(`locale.value`)}</Table.HeaderCell>
                <Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {pages.data.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center! p-12!">
                    {t('empty')}
                  </Table.Cell>
                </Table.Row>
              ) : (
                pages.data.map((page) => {
                  const primary =
                    page.translations.find((t) => t.locale === page.defaultLocale) ??
                    page.translations[0]

                  return (
                    <Table.Row key={`page-${page.id}`}>
                      <Table.Cell data-label={t('value', { count: 1 })}>
                        {primary?.title ?? '—'}
                      </Table.Cell>
                      <Table.Cell data-label={t(`slug`)}>
                        <code>/{primary?.slug ?? '—'}</code>
                      </Table.Cell>
                      <Table.Cell data-label={t(`status.value`)}>
                        {primary && (
                          <span
                            className={`px-4 py-1 border rounded ${statusesClass[primary.status]}`}
                          >
                            {t(`status.${primary.status}` as any)}
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell data-label={t(`locale.value`)}>
                        <div className="flex gap-1 flex-wrap">
                          {page.translations.map((t) => (
                            <span
                              key={t.locale}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-sunken text-ink-muted border border-edge uppercase"
                            >
                              {t.locale}
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${t.status === 'published' ? 'bg-success' : 'bg-edge-strong'}`}
                              />
                            </span>
                          ))}
                        </div>
                      </Table.Cell>
                      <Table.Cell data-label={t('actions.value')}>
                        <div className="flex items-center w-full py-4 gap-2">
                          <CanAccess permission="pages.view">
                            <Button
                              variant="icon_info"
                              route="admin.pages_show.render"
                              routeParams={{ id: page.id }}
                              title={t('actions.show', { title: primary?.title ?? '—' })}
                              fitContent
                            >
                              <Icon name="Eye" size={18} />
                            </Button>
                          </CanAccess>
                          <CanAccess permission="pages.update">
                            <Button
                              variant="icon_warning"
                              route="admin.pages_update.render"
                              routeParams={{ id: page.id }}
                              title={t('actions.edit', { title: primary?.title ?? '—' })}
                              fitContent
                            >
                              <Icon name="Pen" size={18} />
                            </Button>
                          </CanAccess>
                          <CanAccess permission="pages.delete">
                            <Form
                              onBefore={() => {
                                return window.confirm(t('actions.delete.confirm'))
                              }}
                              route="admin.pages.destroy"
                              routeParams={{ id: page.id }}
                            >
                              <Button
                                variant="icon_danger"
                                title={t('actions.delete.value', {
                                  title: primary?.title ?? `Page #${page.id}`,
                                })}
                                fitContent
                              >
                                <Icon name="Trash" size={18} />
                              </Button>
                            </Form>
                          </CanAccess>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  )
                })
              )}
            </Table.Body>
          </Table>
        </Card>
      </AdminMain>
    </>
  )
}

PagesIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
