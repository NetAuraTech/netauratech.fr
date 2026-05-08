import { Section } from '~/components/atoms/section'
import { ReactNode } from 'react'
import { Heading } from '~/components/atoms/heading'
import { Icon } from '~/components/atoms/icon'
import { Head } from '@inertiajs/react'

interface AdminMainBaseProps {
  /** Page title shown in the `<Head>` tag and as the section heading. */
  title: string
  /**
   * Optional Lucide icon displayed to the left of the title.
   * Must be a valid key of the Lucide `icons` map.
   */
  icon?: string
  /**
   * Optional node rendered to the right of the heading row (e.g. a primary
   * action `<Button>` or a `<NavLink>`).
   */
  action?: ReactNode
  /** Page content — typically one or more `<Card>` components. */
  children: ReactNode
}

/**
 * Standard content area for admin pages.
 *
 * Composes a `<Section>` with a two-column heading row (icon + title on the
 * left, optional action on the right) followed by the page children. Also
 * sets the browser tab title via Inertia's `<Head>`.
 *
 * Used as the outermost wrapper for every admin page component so that layout,
 * spacing, and title handling are consistent across the admin section.
 *
 * @example
 * <AdminMain
 *   title="Manage users"
 *   icon="Users"
 *   action={
 *     <CanAccess permission="users.create">
 *       <Button route="admin.users_create.render" variant="secondary" fitContent>
 *         Invite a user
 *       </Button>
 *     </CanAccess>
 *   }
 * >
 *   <Card>...</Card>
 * </AdminMain>
 */
export function AdminMain(props: AdminMainBaseProps) {
  const { title, icon, action, children } = props

  return (
    <Section className="py-8 grid gap-4">
      <Head title={title} />
      <div className="flex gap-3 flex-col md:flex-row justify-between md:items-center w-full">
        <Heading level={2} flex>
          {icon && <Icon name={icon} size={32} />}
          {title}
        </Heading>
        {action}
      </div>
      {children}
    </Section>
  )
}
