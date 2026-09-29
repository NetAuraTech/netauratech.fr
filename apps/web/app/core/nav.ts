import { permissions } from '#start/permissions';
import type { AdminNavEntry } from '#core/types/nav';

/**
 * Admin navigation entries contributed by the core domain (dashboard link).
 * Kept distinct from {@link maintenanceNavEntries} so the sidebar category
 * order of the composed admin menu is unchanged by the domain co-location.
 */
export const coreNavEntries: AdminNavEntry[] = [
	{
		label: 'admin.dashboard.value',
		icon: 'House',
		route: 'admin.core.dashboard.render',
		permission: permissions.admin.access,
		category: 'no_category',
	},
];

/** Admin navigation entries contributed by the core domain's maintenance surface. */
export const maintenanceNavEntries: AdminNavEntry[] = [
	{
		label: 'maintenance.admin.value',
		icon: 'Wrench',
		route: 'admin.core.maintenance.render',
		permission: permissions.settings.maintenance,
		category: 'settings',
	},
];
