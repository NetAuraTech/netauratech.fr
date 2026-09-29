import { type SharedProps } from '@adonisjs/inertia/types';
import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

/**
 * Returns the admin menu shared by the inertia middleware (`admin_menu`
 * prop) and related utilities.
 *
 * The menu is composed server-side from the entries registered by each
 * domain in `start/nav.ts`, so a flavor pruned of a domain automatically
 * renders a sidebar without that domain's entries.
 *
 * @returns An object containing:
 * - `menu` — the menu groups, in sidebar order, with labels already resolved
 * - `getEntryIcon` — a function to retrieve the icon of a menu entry by its route
 *
 * @example
 * const { menu } = useMenu()
 *
 * @example
 * // Retrieve the icon of a menu entry by its route
 * const { getEntryIcon } = useMenu()
 * const icon = getEntryIcon('admin.core.dashboard.render')
 */
export function useMenu() {
	const pageProps = usePage<SharedProps>().props;
	const menu = useMemo(() => pageProps.admin_menu ?? [], [pageProps.admin_menu]);

	/**
	 * Retrieves the icon of a menu entry by its route.
	 *
	 * Searches across all groups of the menu and returns the icon of the
	 * first matching entry, or `undefined` if no entry is found.
	 *
	 * @param route - The route identifier of the menu entry
	 * @returns The icon string if found, otherwise `undefined`
	 *
	 * @example
	 * const icon = getEntryIcon('admin.core.dashboard.render')
	 */
	const getEntryIcon = useCallback(
		(route: string): string | undefined => {
			return menu.flatMap((group) => group.entries).find((entry) => entry.route === route)?.icon;
		},
		[menu],
	);

	return { menu, getEntryIcon };
}
