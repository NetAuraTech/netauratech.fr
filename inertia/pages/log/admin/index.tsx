import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { Data } from '@generated/data'
import { Paginated } from '~/types/paginated'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { useMenu } from '~/hooks/use_admin'
import { Card } from '~/components/atoms/card'
import { Button } from '~/components/atoms/button'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import { Pagination } from '~/components/molecules/pagination'
import Table from '~/components/atoms/table/table'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { AdminLogsIndexTranslations } from '#types/translations'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'
import { SharedProps } from '@adonisjs/inertia/types'

const LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'] as const
const CATEGORIES = [
  'system',
  'security',
  'business',
  'auth',
  'api',
  'database',
  'performance',
] as const

const LEVEL_BADGE_CLASSES: Record<string, string> = {
  debug: 'text-ink-muted border-ink-muted',
  info: 'text-secondary border-secondary bg-secondary-light/20',
  warn: 'text-warning border-warning bg-warning-soft',
  error: 'text-danger border-danger bg-danger-soft',
  fatal: 'text-danger border-danger bg-danger-soft',
}

type PageProps = {
  entries: Paginated<Data.LogEntry>
  filters: {
    level?: string
    category?: string
    search?: string
    actorId?: number
    from?: string
    to?: string
  }
  translations: AdminLogsIndexTranslations
}

export default function LogsIndexPage(props: PageProps) {
  const { entries, filters, translations } = props
  const pageProps = usePage().props
  const { t, format } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  const hasContext = (entry: Data.LogEntry) =>
    (entry.context && Object.keys(entry.context).length > 0) || entry.ip || entry.userAgent

  return (
    <AdminMain title={t('title')} icon={getEntryIcon('admin.logs.render')}>
      <Card
        header={
          <Form
            route="admin.logs.render"
            className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end"
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
              name="level"
              label={t('level.value')}
              placeholder={t('level.placeholder')}
              defaultValue={filters.level}
              sanitize
            >
              {LEVELS.map((level) => (
                <SelectOption key={`level-${level}`} label={t(`level.${level}`)} value={level} />
              ))}
            </Field>
            <Field
              type="select"
              name="category"
              label={t('category.value')}
              placeholder={t('category.placeholder')}
              defaultValue={filters.category}
              sanitize
            >
              {CATEGORIES.map((category) => (
                <SelectOption
                  key={`category-${category}`}
                  label={t(`category.${category}`)}
                  value={category}
                />
              ))}
            </Field>
            <Field
              type="date"
              name="from"
              label={t('date.from')}
              defaultValue={filters.from?.slice(0, 10)}
              sanitize
            />
            <Field
              type="date"
              name="to"
              label={t('date.to')}
              defaultValue={filters.to?.slice(0, 10)}
              sanitize
            />
            <Button type="submit" name="logs-filter-submit" fitContent>
              {t('search.filter')}
            </Button>
          </Form>
        }
        footer={
          <Pagination route="admin.logs.render" filters={filters} metadata={entries.metadata} />
        }
      >
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t('columns.level')}</Table.HeaderCell>
              <Table.HeaderCell>{t('columns.category')}</Table.HeaderCell>
              <Table.HeaderCell>{t('columns.message')}</Table.HeaderCell>
              <Table.HeaderCell>{t('columns.actor')}</Table.HeaderCell>
              <Table.HeaderCell>{t('columns.date')}</Table.HeaderCell>
              <Table.HeaderCell>{t('context.value')}</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {entries.data.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center! p-12!">
                  {t('empty')}
                </Table.Cell>
              </Table.Row>
            ) : (
              entries.data.map((entry) => (
                <Table.Row key={`log-entry-${entry.id}`}>
                  <Table.Cell data-label={t('columns.level')}>
                    <span
                      className={`px-4 py-1 rounded border ${LEVEL_BADGE_CLASSES[entry.level] ?? LEVEL_BADGE_CLASSES.info}`}
                    >
                      {t(`level.${entry.level}` as any)}
                    </span>
                  </Table.Cell>
                  <Table.Cell data-label={t('columns.category')}>
                    <span className="text-ink-muted">{t(`category.${entry.category}` as any)}</span>
                  </Table.Cell>
                  <Table.Cell data-label={t('columns.message')}>
                    <span className="break-all">{entry.message}</span>
                  </Table.Cell>
                  <Table.Cell data-label={t('columns.actor')}>
                    {entry.actorEmail ?? (entry.actorId ? `#${entry.actorId}` : '—')}
                  </Table.Cell>
                  <Table.Cell data-label={t('columns.date')}>
                    {entry.createdAt
                      ? format(new Date(entry.createdAt), 'medium', pageProps.locale as Lang)
                      : '—'}
                  </Table.Cell>
                  <Table.Cell data-label={t('context.value')}>
                    {/* The table CSS right-aligns the last column's content via
                        `justify-end` on its direct flex children (see `table` in app.css). */}
                    <div className="flex flex-col lg:items-end">
                      {hasContext(entry) ? (
                        <details className="w-full lg:w-auto">
                          <summary className="cursor-pointer text-secondary text-left lg:text-right">
                            {t('context.view')}
                          </summary>
                          <pre className="mt-2 max-w-md overflow-x-auto text-left text-xs text-ink-muted">
                            {JSON.stringify(
                              {
                                ...(entry.ip ? { ip: entry.ip } : {}),
                                ...(entry.userAgent ? { userAgent: entry.userAgent } : {}),
                                ...(entry.requestId ? { requestId: entry.requestId } : {}),
                                ...(entry.context ?? {}),
                                ...(entry.error ? { error: entry.error } : {}),
                              },
                              null,
                              2
                            )}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-ink-muted">{t('context.empty')}</span>
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

LogsIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
