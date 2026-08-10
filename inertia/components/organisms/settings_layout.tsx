import { Section } from '~/components/atoms/section'
import { ReactNode } from 'react'
import { Heading } from '~/components/atoms/heading'
import { NavLink } from '~/components/atoms/nav_link'
import { Paragraph } from '~/components/atoms/paragraph'
import { CanAccess } from '~/guards/can_access'
import type { TranslationNodes } from '#types/translations'
import { useTranslation } from '~/hooks/use_translation'
import { Head } from '@inertiajs/react'

const tabs = [
  { id: 'profile', label: 'header.tabs.profile', route: 'settings.profile.render' },
  { id: 'account', label: 'header.tabs.account', route: 'settings.account.render' },
  { id: 'preferences', label: 'header.tabs.preferences', route: 'settings.preferences.render' },
] as const

interface PageProps {
  /** The active tab identifier — used externally to set the page context. */
  tab: (typeof tabs)[number]['id']
  /** Page-specific content rendered inside the settings grid. */
  children: ReactNode
  translations: TranslationNodes
}

/**
 * Shared layout for all settings pages.
 *
 * Renders a centred page title, a horizontal tab bar, and a content grid.
 * The tab bar is split into two groups:
 *
 * - **Left** — the three main settings tabs (Profile, Account, Preferences),
 *   always visible.
 * - **Right** — contextual actions: an Admin link guarded by the
 *   `admin.access` permission (hidden for regular users) and a Logout link.
 *
 * Active tab highlighting is handled by `<NavLink variant="setting_nav">`,
 * which applies a bottom-border indicator when `aria-current="page"` is set.
 *
 * The page title and subtitle are read from the `settings` i18n namespace
 * (`header.title`, `header.sub_title`).
 *
 * @example
 * // Used as the layout wrapper for each settings page component
 * export default function ProfilePage() {
 *   return (
 *     <SettingsLayout tab="profile">
 *       <Card title="Profile">...</Card>
 *     </SettingsLayout>
 *   )
 * }
 */
export function SettingsLayout(props: PageProps) {
  const { children, translations } = props

  const { t } = useTranslation(translations)

  return (
    <>
      <Head title={t('header.title')} />
      <Section>
        <div className="container">
          <div className="text-center mb-8">
            <Heading level={1}>{t('header.title')}</Heading>
            <Paragraph variant="muted" spacing="sm">
              {t('header.sub_title')}
            </Paragraph>
          </div>
          <div className="flex gap-1 justify-between border-b border-edge mb-8">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.id}
                  label={t(tab.label)}
                  route={tab.route}
                  variant="setting_nav"
                />
              ))}
            </div>
            <div className="flex gap-1">
              <CanAccess permission={'admin.access'}>
                <NavLink
                  label={t('header.tabs.admin')}
                  route="admin.dashboard.render"
                  variant="setting_nav"
                />
              </CanAccess>
              <NavLink
                name="logout"
                label={t('header.tabs.logout')}
                route="auth.session.destroy"
                variant="setting_nav"
              />
            </div>
          </div>
          <div className="grid gap-6">{children}</div>
        </div>
      </Section>
    </>
  )
}
