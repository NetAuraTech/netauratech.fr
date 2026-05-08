import { ReactElement } from 'react'
import { Button, variants } from '~/components/atoms/button'
import Layout from '~/layouts/admin'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { Data } from '@generated/data'
import { Card } from '~/components/atoms/card'
import { CanAccess } from '~/guards/can_access'
import { Icon } from '~/components/atoms/icon'
import { Heading } from '~/components/atoms/heading'
import { NavLink } from '~/components/atoms/nav_link'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { CmsPagesShowTranslations } from '#types/translations'
import { SharedProps } from '@adonisjs/inertia/types'
import { usePage } from '@inertiajs/react'
import { Form } from '@adonisjs/inertia/react'

interface Props {
  page: Data.Page
  translations: CmsPagesShowTranslations
}

const statusesClass = {
  published: {
    badge: 'text-success border-success bg-success-soft',
    dot: 'bg-success',
  },
  draft: {
    badge: 'text-secondary border-secondary bg-secondary-light/20',
    dot: 'bg-secondary-light',
  },
  archived: {
    badge: 'text-warning border-warning bg-warning-soft',
    dot: 'bg-warning',
  },
} as const

export default function PagesShowPage(props: Props) {
  const { page, translations } = props
  const pageProps = usePage<SharedProps>().props
  const { t, format } = useTranslation(translations)

  const primaryTranslation =
    page.translations.find((t) => t.locale === page.defaultLocale) ?? page.translations[0]

  return (
    <>
      <AdminMain title={t('title', { title: primaryTranslation?.title ?? `Page #${page.id}` })}>
        <Card
          header={
            <div className="flex items-center justify-between gap-3">
              <CanAccess permission="pages.view">
                <Button
                  variant="icon"
                  route="admin.pages.render"
                  title={t('actions.back')}
                  fitContent
                >
                  <Icon name="ArrowLeft" />
                </Button>
              </CanAccess>
              <div className="flex gap-3">
                <CanAccess permission="pages.update">
                  <Button
                    variant="icon_warning"
                    route="admin.pages_update.render"
                    routeParams={{ id: page.id }}
                    title={t('actions.edit', {
                      title: primaryTranslation?.title ?? `Page #${page.id}`,
                    })}
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
                        title: primaryTranslation?.title ?? `Page #${page.id}`,
                      })}
                      fitContent
                    >
                      <Icon name="Trash" size={18} />
                    </Button>
                  </Form>
                </CanAccess>
              </div>
            </div>
          }
        >
          <div className="grid gap-3">
            <div className="grid gap-3">
              <Heading level={3}>{t('translation', { count: page.translations.length })}</Heading>
              {page.translations.map((translation) => {
                const isDefault = translation.locale === page.defaultLocale

                return (
                  <div
                    key={translation.id}
                    className="flex flex-col md:flex-row items-center justify-between gap-3 rounded-xl border border-edge bg-canvas px-4 py-3"
                  >
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2 w-16 shrink-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${statusesClass[translation.status].dot} shrink-0`}
                        />
                        <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                          {translation.locale}
                        </span>
                        {isDefault && (
                          <span className="text-xs text-ink-subtle">({t('default')})</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{translation.title}</p>
                        <code className="text-xs text-ink-muted">/{translation.slug}</code>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <span
                        className={`px-4 py-1 border rounded ${statusesClass[translation.status].badge}`}
                      >
                        {t(`status.${translation.status}`)}
                      </span>
                      <div className="flex items-center gap-3 text-ink-subtle shrink-0">
                        {translation.metaTitle && (
                          <span className="flex items-center gap-1" title={t('meta.title')}>
                            <Icon name="Tag" size={18} />
                            SEO
                          </span>
                        )}
                        <span title={t('last_update')}>
                          {format(
                            new Date(translation.updatedAt!),
                            'medium',
                            pageProps.locale as Lang
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {translation.status === 'published' && (
                          <a
                            href={`/${translation.locale !== page.defaultLocale ? `${translation.locale}/` : ''}${translation.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`button ${variants['icon_info']}`}
                            title={t('actions.show', {
                              title: translation?.title ?? '—',
                            })}
                          >
                            <Icon name="Eye" size={18} />
                          </a>
                        )}
                        <Button
                          variant="icon_warning"
                          route="admin.pages_update.render"
                          routeParams={{ id: page.id }}
                          title={t('actions.edit', {
                            title: primaryTranslation?.title ?? `Page #${page.id}`,
                          })}
                          fitContent
                        >
                          <Icon name="Pen" size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="grid gap-3">
              <Heading level={3}>{t('meta.value')}</Heading>
              <div className="rounded-xl border border-edge bg-canvas divide-y divide-edge">
                <MetaRow label={t('meta.id')} value={String(page.id)} />
                <MetaRow label={t('meta.locale')} value={page.defaultLocale.toUpperCase()} />
                <MetaRow label={t('meta.translations')} value={`${page.translations.length}`} />
                <MetaRow
                  label={t('meta.created')}
                  value={format(new Date(page.createdAt!), 'medium', pageProps.locale as Lang)}
                />
                <MetaRow
                  label={t('meta.updated')}
                  value={format(new Date(page.updatedAt!), 'medium', pageProps.locale as Lang)}
                />
              </div>
            </div>
            <div className="grid gap-3">
              <Heading level={3}>{t('revision.value')}</Heading>
              {page.translations.map((translation) => (
                <NavLink
                  label=""
                  key={translation.id}
                  route="admin.page_revisions.index"
                  routeParams={{ id: page.id, translationId: translation.id }}
                >
                  <div className="flex items-center justify-between rounded-lg border border-edge bg-canvas px-4 py-2.5 hover:bg-sunken transition-colors group">
                    <span className="text-ink">
                      {translation.locale.toUpperCase()} — {translation.title}
                    </span>
                    <span className="text-ink-muted group-hover:text-primary transition-colors">
                      {t('revision.view')} →
                    </span>
                  </div>
                </NavLink>
              ))}
            </div>
            <HomepageSection page={page} translations={translations} />
          </div>
        </Card>
      </AdminMain>
    </>
  )
}

function HomepageSection({
  page,
  translations,
}: {
  page: Data.Page
  translations: CmsPagesShowTranslations
}) {
  const { t } = useTranslation(translations)
  function handleSetHomepage() {
    if (page.isHomepage) return
    if (!confirm('Set this page as the homepage? The current homepage will be unset.')) return
  }

  return (
    <div className="grid gap-3">
      <Heading level={3}>{t('homepage.value')}</Heading>
      <div className="rounded-xl border border-edge bg-canvas px-4 py-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink flex items-center gap-2">
            {page.isHomepage && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success bg-success-soft px-2 py-0.5 rounded-full border border-success/20">
                ✓ {t('homepage.help.title.set')}
              </span>
            )}
            {!page.isHomepage && t('homepage.help.title.not_set')}
          </p>
          <p className="text-xs text-ink-muted mt-0.5">
            {page.isHomepage ? t('homepage.help.message.set') : t('homepage.help.message.not_set')}
          </p>
        </div>
        {!page.isHomepage && (
          <Form
            onBefore={() => {
              return window.confirm(t('homepage.confirm'))
            }}
            route="admin.pages.set_homepage"
            routeParams={{ id: page.id }}
          >
            <Button variant="secondary" onClick={handleSetHomepage} fitContent>
              {t('homepage.submit')}
            </Button>
          </Form>
        )}
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{value}</span>
    </div>
  )
}

PagesShowPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
