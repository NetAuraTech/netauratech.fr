import { ReactNode } from 'react'
import { Link, type LinkProps } from '@adonisjs/inertia/react'
import { Card } from '~/components/atoms/card'

type Route = NonNullable<LinkProps['route']>

interface RecentCardProps {
  /** Card title shown in the header. */
  title: string
  /** Admin route the "view all" footer link deep-links to. */
  viewAllRoute: Route
  /** Label of the "view all" footer link. */
  viewAllLabel: string
  /** Recent-activity list content. */
  children: ReactNode
}

/**
 * Recent-activity list card with a "view all" link in its footer.
 *
 * Shared by every admin dashboard section card that contributes a
 * recent-activity list; the section's card component owns its title, "view
 * all" route and list content.
 */
export function RecentCard({ title, viewAllRoute, viewAllLabel, children }: RecentCardProps) {
  return (
    <Card
      title={title}
      padding="p-0"
      className="h-full"
      footer={
        <Link route={viewAllRoute} className="text-sm text-primary hover:underline">
          {viewAllLabel}
        </Link>
      }
    >
      {children}
    </Card>
  )
}
