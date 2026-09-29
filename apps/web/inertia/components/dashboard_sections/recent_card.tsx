import { Link } from '@adonisjs/inertia/react';
import { Card } from '@foundry/design-system/card';
import { ReactNode } from 'react';

interface RecentCardProps {
	/** Card title shown in the header. */
	title: string;
	/**
	 * Resolved URL the "view all" footer link deep-links to. The caller
	 * builds it (e.g. with a typed `urlFor()`) — the component never resolves
	 * routes.
	 */
	viewAllHref: string;
	/** Label of the "view all" footer link. */
	viewAllLabel: string;
	/** Recent-activity list content. */
	children: ReactNode;
}

/**
 * Recent-activity list card with a "view all" link in its footer.
 *
 * Shared by every admin dashboard section card that contributes a
 * recent-activity list; the section's card component owns its title, "view
 * all" href and list content.
 */
export function RecentCard({ title, viewAllHref, viewAllLabel, children }: RecentCardProps) {
	return (
		<Card
			title={title}
			padding="p-0"
			className="h-full"
			footer={
				<Link href={viewAllHref} className="text-sm text-primary hover:underline">
					{viewAllLabel}
				</Link>
			}
		>
			{children}
		</Card>
	);
}
