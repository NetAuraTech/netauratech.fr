import { cn, tv } from 'tailwind-variants';

const adminHeader = tv({
	base: 'flex items-center justify-between p-4 bg-surface border-b-2 border-edge sticky top-0 z-50',
});

interface AdminHeaderProps {
	/** Callback fired when the sidebar toggle button is clicked. */
	handleClick: () => void;
	/** Additional Tailwind classes merged onto the `<header>`. */
	className?: string;
}

/**
 * Sticky top bar for the admin layout.
 *
 * Renders a single sidebar-toggle button (hamburger icon) anchored to the
 * top of the viewport via `sticky top-0 z-50`. The button calls `handleClick`
 * on click, which is expected to toggle the `aria-expanded` state on the
 * `<AdminSidebar>` from the parent layout.
 *
 * @example
 * // Inside the admin layout
 * const [sidebarOpen, setSidebarOpen] = useState(false)
 *
 * <AdminHeader handleClick={() => setSidebarOpen((v) => !v)} />
 * <AdminSidebar
 *   sidebarOpen={sidebarOpen}
 *   user={user}
 *   dateLabel={dateLabel}
 *   menu={menu}
 * />
 */
export function AdminHeader(props: AdminHeaderProps) {
	const { handleClick, className } = props;

	return (
		<header className={cn(adminHeader(), className)}>
			<button
				onClick={handleClick}
				className="p-2 rounded text-ink-inverted bg-primary hover:bg-primary-deep transition-colors cursor-pointer"
				aria-label="Toggle sidebar"
			>
				<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
					<line x1="3" y1="12" x2="21" y2="12" />
					<line x1="3" y1="6" x2="21" y2="6" />
					<line x1="3" y1="18" x2="21" y2="18" />
				</svg>
			</button>
		</header>
	);
}
