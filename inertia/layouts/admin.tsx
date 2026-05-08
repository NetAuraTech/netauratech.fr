import { ReactElement, useEffect, useState } from 'react'
import { toast, Toaster } from 'sonner'
import { useIsLarge } from '~/hooks/use_is_large'
import { AdminSidebar } from '~/components/organisms/admin/admin_sidebar'
import { AdminHeader } from '~/components/organisms/admin/admin_header'
import { SharedProps } from '@adonisjs/inertia/types'
import { Head, usePage } from '@inertiajs/react'

interface LayoutProps {
  children: ReactElement<SharedProps>
}

/**
 * Root layout for all admin pages.
 *
 * Composes the admin shell: a collapsible `<AdminSidebar>`, a sticky
 * `<AdminHeader>` with the sidebar toggle, and the page content area. A
 * `<Toaster>` is mounted at top-right to surface flash messages passed via
 * Inertia shared props (`flash.error`, `flash.success`, `flash.info`).
 *
 * **Sidebar behaviour:**
 * - Opens automatically on large viewports (`lg` breakpoint) via `useIsLarge`.
 * - On mobile, a semi-transparent backdrop is rendered over the content area
 *   when the sidebar is open; clicking it closes the sidebar.
 * - Active element focus is blurred on toggle/close to prevent lingering
 *   focus rings on the trigger button.
 *
 * **Flash messages:**
 * - Displayed via `sonner` toast notifications.
 * - All toasts are dismissed on every Inertia navigation so stale messages
 *   never carry over to the next page.
 *
 * **CSRF:** The token is injected as a `<meta name="csrf-token">` tag so that
 * non-Inertia fetch calls (e.g. the theme toggle) can read it from the DOM.
 *
 * @example
 * // Attached to an admin page component
 * UsersIndexPage.layout = (page) => <Layout>{page}</Layout>
 */
export default function Layout(props: LayoutProps) {
  const isLarge = useIsLarge()
  const { props: pageProps, url } = usePage<SharedProps>()
  const { children } = props

  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleNavButtonClick = () => {
    setSidebarOpen(!sidebarOpen)

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  const closeMenu = () => {
    setSidebarOpen(false)

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  useEffect(() => {
    setSidebarOpen(isLarge)
  }, [isLarge])

  useEffect(() => {
    toast.dismiss()
  }, [url])

  if (children.props.flash?.error) {
    toast.error(children.props.flash.error)
  }

  if (children.props.flash?.success) {
    toast.success(children.props.flash.success)
  }

  if (children.props.flash?.info) {
    toast.info(children.props.flash.info)
  }

  return (
    <>
      <Head>
        <meta name="csrf-token" content={pageProps.csrfToken} />
      </Head>
      <Toaster position="top-right" richColors />
      <div className="admin">
        <AdminSidebar sidebarOpen={sidebarOpen} />
        <div className="main">
          <AdminHeader handleClick={handleNavButtonClick} />
          <main>{children}</main>
        </div>
        {sidebarOpen && (
          <div
            className="block lg:hidden fixed inset-0 bg-ink/50 z-49"
            onClick={() => closeMenu()}
          />
        )}
      </div>
    </>
  )
}
