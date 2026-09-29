import { cn, tv } from 'tailwind-variants';
import { Avatar } from '../../atoms/avatar/avatar';
import { Card } from '../../atoms/card/card';
import { Heading } from '../../atoms/heading/heading';
import { Icon } from '../../atoms/icon/icon';
import { NavLink } from '../../atoms/nav_link/nav_link';
import type { ReactNode } from 'react';

/**
 * A single resolved navigation entry for the {@link AdminSidebar}.
 *
 * The `href` is built by the caller (e.g. with a typed `urlFor`) and the entry
 * is only present if the caller has already checked the user may access it —
 * the sidebar neither resolves routes nor evaluates permissions.
 */
export interface AdminMenuEntry {
	/** Resolved (localized) label. */
	label: string;
	/** Resolved URL the entry navigates to. */
	href: string;
	/** Optional icon name resolved by the `Icon` atom. */
	icon?: string;
	/**
	 * Whether the entry points at the current page, computed by the caller (the
	 * sidebar never inspects the URL itself). Active entries get
	 * `aria-current="page"` and the variant's `current:` styles.
	 */
	isActive?: boolean;
}

/**
 * A sidebar category grouping resolved {@link AdminMenuEntry} items.
 */
export interface AdminMenuGroup {
	/** Stable category identifier, used as a React key. */
	category: string;
	/** Category heading; `null` renders the entries without a heading. */
	label: string | null;
	/** Entries in this category, already filtered by the caller. */
	entries: AdminMenuEntry[];
}

const adminSidebar = tv({
	base: 'sidebar',
});

interface AdminSidebarProps {
	/**
	 * Whether the sidebar is currently open. Forwarded to `aria-expanded` on
	 * the `<aside>` so CSS transitions and screen readers react to the change.
	 * The parent layout is responsible for toggling this.
	 */
	sidebarOpen: boolean;
	/** The authenticated user, or `null` when unauthenticated. */
	user: { username: string } | null;
	/** Pre-formatted current-date string (locale resolved by the caller). */
	dateLabel: string;
	/**
	 * Navigation groups with resolved hrefs and active states. The caller
	 * builds each href, computes each `isActive`, and drops entries the user
	 * may not access before injecting them.
	 */
	menu: AdminMenuGroup[];
	/**
	 * Optional node rendered opposite the user avatar (e.g. a theme toggle).
	 * Injected by the caller so the sidebar stays free of app-specific widgets.
	 */
	userActions?: ReactNode;
	/** Additional Tailwind classes merged onto the `<aside>`. */
	className?: string;
}

/**
 * Renders one navigation entry. Kept as a private child so the `NavLink` is
 * instantiated once per entry rather than inline in the list callback. The
 * active state is injected through the `entry.isActive` prop.
 */
function AdminMenuEntryItem(props: { entry: AdminMenuEntry }) {
	const { entry } = props;

	return (
		<NavLink href={entry.href} isActive={entry.isActive} label={entry.label} variant="admin_nav">
			{entry.icon && <Icon name={entry.icon} />}
		</NavLink>
	);
}

/**
 * Collapsible navigation sidebar for the admin layout.
 *
 * Composed of two `<Card>` sections:
 *
 * 1. **User card** — shows the injected user's avatar, an optional `userActions`
 *    node (e.g. a theme toggle), and the injected current-date string.
 * 2. **Navigation card** — renders the injected menu groups. Each entry is a
 *    resolved, permission-filtered link; the sidebar adds no data of its own.
 *
 * Visibility is controlled by CSS via the `aria-expanded` attribute on the
 * `<aside>` and the `.sidebar` utility class. The parent layout toggles
 * `sidebarOpen`.
 *
 * @example
 * const [sidebarOpen, setSidebarOpen] = useState(false)
 *
 * <AdminHeader handleClick={() => setSidebarOpen((v) => !v)} />
 * <AdminSidebar
 *   sidebarOpen={sidebarOpen}
 *   user={user ? { username: user.username } : null}
 *   dateLabel={format(new Date(), 'long', locale)}
 *   menu={resolvedMenu}
 *   userActions={<ThemeToggle />}
 * />
 */
export function AdminSidebar(props: AdminSidebarProps) {
	const { sidebarOpen, user, dateLabel, menu, userActions, className } = props;

	return (
		<aside className={cn(adminSidebar(), className)} aria-expanded={sidebarOpen}>
			<Card>
				<div className="grid gap-3">
					<div className="flex items-center justify-between">
						{user && <Avatar username={user.username} showUsername />}
						{userActions}
					</div>
					<span>{dateLabel}</span>
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
										<AdminMenuEntryItem entry={entry} />
									</li>
								))}
							</ul>
						</div>
					))}
				</nav>
			</Card>
		</aside>
	);
}
