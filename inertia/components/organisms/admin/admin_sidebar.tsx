import { Card } from '../../atoms/card'
import { Avatar } from '~/components/atoms/avatar'
import { ThemeToggle } from '~/components/molecules/theme_toggle'
import { Heading } from '../../atoms/heading'
import { NavLink } from '../../atoms/nav_link'
import { CanAccess } from '~/guards/can_access'
import { useMenu } from '~/hooks/use_admin'
import { Icon } from '~/components/atoms/icon'
import { Lang, useTranslation } from '~/hooks/use_translation'
import { usePage } from '@inertiajs/react'
import { SharedProps } from '@adonisjs/inertia/types'

interface AdminSidebarProps {
  /**
   * Whether the sidebar is currently open. Forwarded to `aria-expanded` on
   * the `<aside>` element so CSS transitions and screen readers react to the
   * state change.
   */
  sidebarOpen: boolean
}

/**
 * Collapsible navigation sidebar for the admin layout.
 *
 * Composed of two `<Card>` sections:
 *
 * 1. **User card** — shows the authenticated user's avatar, username, the
 *    current date (formatted in the active locale), and the `<ThemeToggle>`.
 * 2. **Navigation card** — renders the menu entries returned by `useMenu`,
 *    grouped by category. Each entry is wrapped in a `<CanAccess>` guard so
 *    links the user lacks permission for are silently hidden.
 *
 * Visibility is controlled by CSS via the `aria-expanded` attribute on the
 * `<aside>` and the `.sidebar` utility class defined in `app.css`. The
 * parent layout is responsible for toggling `sidebarOpen`.
 *
 * @example
 * const [sidebarOpen, setSidebarOpen] = useState(false)
 *
 * <AdminHeader handleClick={() => setSidebarOpen((v) => !v)} />
 * <AdminSidebar sidebarOpen={sidebarOpen} />
 */
export function AdminSidebar(props: AdminSidebarProps) {
  const { sidebarOpen } = props
  const pageProps = usePage<SharedProps>().props
  const { format } = useTranslation({})

  const { menu } = useMenu()

  return (
    <aside className="sidebar" aria-expanded={sidebarOpen}>
      <Card>
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <Avatar showUsername />
            <ThemeToggle />
          </div>
          <span>{format(new Date(), 'long', pageProps.locale as Lang)}</span>
        </div>
      </Card>
      <Card>
        <nav className="grid gap-1">
          {menu.map((group) => (
            <div key={`admin-category-${group.category}`}>
              {group.label && <Heading level={4}>{group.label}</Heading>}
              <ul className="grid gap-1 my-2">
                {group.entries.map((entry) => (
                  <li key={`admin-category-${group.category}-${entry.label}`}>
                    <CanAccess permission={entry.permission}>
                      <NavLink
                        label={entry.label}
                        route={entry.route as any}
                        routeParams={entry.routeParams}
                        variant="admin_nav"
                      >
                        {entry.icon && <Icon name={entry.icon} />}
                      </NavLink>
                    </CanAccess>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </Card>
    </aside>
  )
}
