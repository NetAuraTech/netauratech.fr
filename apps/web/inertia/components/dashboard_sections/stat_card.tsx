import { Link } from '@adonisjs/inertia/react';
import { Card } from '@foundry/design-system/card';
import { Icon } from '@foundry/design-system/icon';
import { Paragraph } from '@foundry/design-system/paragraph';
import { ReactNode } from 'react';

interface StatCardProps {
	/** Lucide icon name rendered before the label. */
	icon: string;
	/** Card label shown under the figure. */
	label: string;
	/** Headline figure. */
	value: number;
	/**
	 * Resolved URL the whole card deep-links to. The caller builds it (e.g.
	 * with a typed `urlFor()`) — the component never resolves routes.
	 */
	href: string;
	/** Optional extra content (breakdowns, links) rendered below the figure. */
	children?: ReactNode;
}

/**
 * Clickable headline figure deep-linking to its management page.
 *
 * Shared by every admin dashboard section card; a section's card component
 * owns its label/href/figure and composes extra breakdown content here.
 */
export function StatCard({ icon, label, value, href, children }: StatCardProps) {
	return (
		<Link href={href} className="block group">
			<Card padding="p-6" className="h-full transition-colors group-hover:border-primary">
				<div className="flex items-center gap-4">
					<Icon name={icon} size={28} className="text-ink-muted shrink-0" />
					<div className="flex items-baseline gap-2">
						<p className="text-3xl font-bold leading-none">{value}</p>
						<Paragraph variant="muted" spacing="xs">
							{label}
						</Paragraph>
					</div>
				</div>
				{children}
			</Card>
		</Link>
	);
}
