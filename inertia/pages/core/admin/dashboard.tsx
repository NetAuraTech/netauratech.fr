import { ReactElement } from 'react'
import Layout from '~/layouts/admin'
import { SharedProps } from '@adonisjs/inertia/types'
import { Data } from '@generated/data'
import { AdminMain } from '~/components/organisms/admin/admin_main'
import { usePage } from '@inertiajs/react'
import { Lang, useTranslation } from '~/hooks/use_translation'
import type { AdminDashboardTranslations } from '#types/translations'
import { getDashboardSectionBundle } from '~/lib/dashboard_sections'

interface Props {
  stats: Data.Dashboard
  translations: AdminDashboardTranslations
}

/**
 * Eagerly import every dashboard section card so each module registers its
 * cards into the client-side section registry (`~/lib/dashboard_sections`) at
 * import time. The glob matches the core cards (`auth`, `file`) and, when the
 * CMS subtree exists, the CMS cards (`page`, `template`) — a pruned flavor
 * simply has no `components/cms/` directory, so the glob matches only the core
 * cards and the page renders exactly the sections present in the payload.
 */
void import.meta.glob('../../../components/**/dashboard_sections/*.tsx', { eager: true })

/**
 * Admin dashboard: one block per domain section present in the payload.
 *
 * Every section is optional server-side (a domain contributes its figures
 * only when it registered a collector), so each block renders only when its
 * section is provided — a domain absent from the composition simply
 * disappears instead of leaving empty figures behind.
 */
export default function DashboardPage(props: Props) {
  const { stats, translations } = props
  const pageProps = usePage<SharedProps>().props
  const { t, format } = useTranslation(translations)

  const formatDate = (value: string | null) =>
    value ? format(new Date(value), 'medium', pageProps.locale as Lang) : '—'

  const sections = Object.entries(stats) as [keyof Data.Dashboard, unknown][]

  return (
    <AdminMain title={t('title')} icon="House">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sections.map(([key]) => {
          const bundle = getDashboardSectionBundle(String(key))
          if (!bundle) return null
          const SectionCard = bundle.Stat
          return (
            <SectionCard
              key={key}
              stats={stats}
              translations={translations}
              formatDate={formatDate}
            />
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(([key]) => {
          const bundle = getDashboardSectionBundle(String(key))
          if (!bundle?.Recent) return null
          const RecentCard = bundle.Recent
          return (
            <RecentCard
              key={key}
              stats={stats}
              translations={translations}
              formatDate={formatDate}
            />
          )
        })}
      </div>
    </AdminMain>
  )
}

DashboardPage.layout = (page: ReactElement<SharedProps>) => <Layout>{page}</Layout>
