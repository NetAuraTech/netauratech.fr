import { SharedProps } from '@adonisjs/inertia/types';
import { AdminHeader } from '@foundry/design-system/admin-header';
import { AdminSidebar } from '@foundry/design-system/admin-sidebar';
import { Head, usePage } from '@inertiajs/react';
import { ReactElement, useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import { urlFor } from '~/client';
import { ThemeToggle } from '~/components/molecules/theme_toggle';
import { useMenu } from '~/hooks/use_admin';
import { useAuth } from '~/hooks/use_auth';
import { useIsLarge } from '~/hooks/use_is_large';
import { isNavLinkActive } from '~/hooks/use_nav_link_active';
import { Lang, useTranslation } from '~/hooks/use_translation';

interface LayoutProps {
	children: ReactElement<SharedProps>;
}

/**
 * Root layout for all admin pages.
 *
 * Composes the admin shell: a collapsible `<AdminSidebar>`, a sticky
 * `<AdminHeader>` with the sidebar toggle, and the page content area. A
 * `<Toaster>` is mounted at top-right to surface flash messages read from
 * the Inertia flash bag (`flash.error`, `flash.success`, `flash.info`).
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
	const isLarge = useIsLarge();
	const { props: pageProps, url, flash } = usePage<SharedProps>();
	const { children } = props;

	const [sidebarOpen, setSidebarOpen] = useState(false);

	const { menu: rawMenu } = useMenu();
	const { user, can, canAny } = useAuth();
	const { format } = useTranslation({});

	const resolvedMenu = rawMenu
		.map((group) => ({
			category: group.category,
			label: group.label,
			entries: group.entries
				.filter((entry) => (Array.isArray(entry.permission) ? canAny(entry.permission) : can(entry.permission)))
				.map((entry) => {
					const href = urlFor(entry.route as any, entry.routeParams as any);
					return {
						label: entry.label,
						href,
						icon: entry.icon,
						isActive: isNavLinkActive(href),
					};
				}),
		}))
		.filter((group) => group.entries.length > 0);

	const dateLabel = format(new Date(), 'long', pageProps.locale as Lang);

	const handleNavButtonClick = () => {
		setSidebarOpen(!sidebarOpen);

		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	};

	const closeMenu = () => {
		setSidebarOpen(false);

		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
	};

	useEffect(() => {
		setSidebarOpen(isLarge);
	}, [isLarge]);

	useEffect(() => {
		toast.dismiss();
	}, [url]);

	if (flash.error) {
		toast.error(flash.error);
	}

	if (flash.success) {
		toast.success(flash.success);
	}

	if (flash.info) {
		toast.info(flash.info);
	}

	return (
		<>
			<Head>
				<meta name="csrf-token" content={pageProps.csrfToken} />
			</Head>
			<Toaster position="top-right" richColors />
			<div className="admin">
				<AdminSidebar
					sidebarOpen={sidebarOpen}
					user={user ? { username: user.username } : null}
					dateLabel={dateLabel}
					menu={resolvedMenu}
					userActions={<ThemeToggle />}
				/>
				<div className="main">
					<AdminHeader handleClick={handleNavButtonClick} />
					<main>{children}</main>
				</div>
				{sidebarOpen && <div className="block lg:hidden fixed inset-0 bg-ink/50 z-49" onClick={() => closeMenu()} />}
			</div>
		</>
	);
}
