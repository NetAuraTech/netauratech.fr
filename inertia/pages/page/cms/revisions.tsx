import { Button, variants } from '~/components/atoms/button'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Card } from '~/components/atoms/card'
import { Icon } from '~/components/atoms/icon'
import { CanAccess } from '~/guards/can_access'
import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { useMenu } from '~/hooks/use_admin'
import { Paragraph } from '~/components/atoms/paragraph'
import Table from '~/components/atoms/table/table'
import { Data } from '@generated/data'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { CmsPagesRevisionTranslations } from '#types/translations'
import { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'

interface PageProps {
  revisions: Data.PageRevision[]
  translation_id: number
  page_id: number
  translations: CmsPagesRevisionTranslations
}

export default function PageRevisionsPage(props: PageProps) {
  const { revisions, translation_id, page_id, translations } = props
  const pageProps = usePage<SharedProps>().props

  const { t, format } = useTranslation(translations)
  const { getEntryIcon } = useMenu()

  return (
    <>
      <AdminMain title={t('title')} icon={getEntryIcon('admin.pages.render')}>
        <Card
          header={
            <CanAccess permission="pages.update">
              <Button
                variant="icon"
                route="admin.pages_update.render"
                routeParams={{ id: page_id }}
                title={t('actions.back')}
                fitContent
              >
                <Icon name="ArrowLeft" />
              </Button>
            </CanAccess>
          }
          footer={<Paragraph variant="muted">{t('help')}</Paragraph>}
        >
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>{t('index')}</Table.HeaderCell>
                <Table.HeaderCell>{t('created.at')}</Table.HeaderCell>
                <Table.HeaderCell>{t('created.by')}</Table.HeaderCell>
                <Table.HeaderCell>{t('actions.value')}</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {revisions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center! p-12!">
                    <Paragraph variant="muted">{t('empty.value')}</Paragraph>
                    <Paragraph variant="subtle">{t('empty.help')}</Paragraph>
                  </Table.Cell>
                </Table.Row>
              ) : (
                revisions.map((revision, index) => (
                  <Table.Row key={`revision-${revision.id}`}>
                    <Table.Cell data-label={t('index')}>{revisions.length - index}</Table.Cell>
                    <Table.Cell data-label={t('created.at')}>
                      {format(
                        new Date(revision.createdAt!),
                        'medium',
                        pageProps.locale as Lang,
                        {
                          withTime: true,
                        } as any
                      )}
                    </Table.Cell>
                    <Table.Cell data-label={t('created.by')}>
                      {revision.created_by && revision.created_by.username}
                    </Table.Cell>
                    <Table.Cell data-label={t('actions.value')}>
                      <div className="flex items-center w-full py-4 gap-2">
                        {index !== 0 ? (
                          <CanAccess permission="pages.update">
                            <Form
                              onBefore={() => {
                                return window.confirm(t('actions.restore.confirm'))
                              }}
                              route="admin.page_revisions.restore"
                              routeParams={{
                                translationId: translation_id,
                                revisionId: revision.id,
                                id: page_id,
                              }}
                            >
                              <Button
                                variant="icon_info"
                                title={t('actions.restore.value')}
                                fitContent
                              >
                                <Icon name="ArchiveRestore" size={18} />
                              </Button>
                            </Form>
                          </CanAccess>
                        ) : (
                          <span
                            className={`button ${variants['icon_info']} font-medium cursor-not-allowed pointer-events-none`}
                          >
                            {t('latest')}
                          </span>
                        )}
                        <CanAccess permission="pages.update">
                          <Form
                            route="admin.page_revisions.toggle_keep"
                            routeParams={{
                              translationId: translation_id,
                              revisionId: revision.id,
                              id: page_id,
                            }}
                          >
                            <Button
                              variant={revision.keep ? 'icon_danger' : 'icon_warning'}
                              title={revision.keep ? t('actions.unpin') : t('actions.pin')}
                              fitContent
                            >
                              <Icon name={revision.keep ? 'PinOff' : 'Pin'} size={18} />
                            </Button>
                          </Form>
                        </CanAccess>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </Card>
      </AdminMain>
    </>
  )
}

PageRevisionsPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
