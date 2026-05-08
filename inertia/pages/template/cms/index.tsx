import { ReactElement } from 'react'
import { Button } from '~/components/atoms/button'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Data } from '@generated/data'
import Layout from '~/layouts/admin'
import { Card } from '~/components/atoms/card'
import { Field } from '~/components/molecules/field'
import { SelectOption } from '~/components/atoms/select_option'
import { Icon } from '~/components/atoms/icon'
import { CanAccess } from '~/guards/can_access'
import { useMenu } from '~/hooks/use_admin'
import { Paragraph } from '~/components/atoms/paragraph'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { CmsTemplatesTranslations } from '#types/translations'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'
import { Form } from '@adonisjs/inertia/react'

interface TemplatesIndexPageProps {
  templates: Data.Template[]
  filters: {
    type?: string
    block_type?: string
    search?: string
  }
  translations: CmsTemplatesTranslations
}

export default function TemplatesIndexPage(props: TemplatesIndexPageProps) {
  const { templates, filters, translations } = props
  const pageProps = usePage<SharedProps>().props
  const { t, format } = useTranslation(translations)

  const { getEntryIcon } = useMenu()

  return (
    <>
      <AdminMain title={t('title')} icon={getEntryIcon('admin.templates.render')}>
        <Card
          header={
            <Form
              route="admin.templates.render"
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
                name="type"
                label={t('search.type.value')}
                placeholder={t('search.type.placeholder')}
                defaultValue={filters.type}
                sanitize
              >
                <SelectOption label={t('search.type.page')} value="page" />
                <SelectOption label={t('search.type.block')} value="block" />
              </Field>
              <Button type="submit" fitContent>
                {t('search.filter')}
              </Button>
            </Form>
          }
        >
          {templates.length === 0 ? (
            <div className="text-center py-20 rounded-xl border border-dashed border-edge">
              <Paragraph variant="muted">{t('empty.value')}</Paragraph>
              <Paragraph variant="subtle">{t('empty.help')}</Paragraph>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-edge bg-canvas p-4 flex flex-col gap-3 justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">
                        {t(template.name as any, { defaultValue: template.name })}
                      </p>
                      {template.description && (
                        <p className="text-ink-muted mt-0.5 line-clamp-2">
                          {t(template.description as any, { defaultValue: template.description })}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 px-3 py-1 rounded-full border font-medium ${
                        template.type === 'page'
                          ? 'bg-primary-light text-primary-deep border-primary-deep'
                          : 'bg-secondary-light text-secondary-deep border-secondary-deep'
                      }`}
                    >
                      {template.type === 'block' && template.blockType
                        ? t(template.blockType as any, { defaultValue: template.blockType })
                        : t(template.type as any, { defaultValue: template.type })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-edge">
                    <span className="text-ink-subtle">
                      {format(new Date(template.createdAt!), 'medium', pageProps.locale as Lang)}
                    </span>
                    <CanAccess permission="templates.manage">
                      <Form
                        onBefore={() => {
                          return window.confirm(t('delete.confirm'))
                        }}
                        route="admin.templates.destroy"
                        routeParams={{ id: template.id }}
                      >
                        <Button
                          variant="icon_danger"
                          title={t('delete.value', {
                            name: template.name,
                          })}
                          fitContent
                        >
                          <Icon name="Trash" size={18} />
                        </Button>
                      </Form>
                    </CanAccess>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </AdminMain>
    </>
  )
}

TemplatesIndexPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
