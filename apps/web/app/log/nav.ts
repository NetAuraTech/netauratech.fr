import { permissions } from '#start/permissions';
import type { AdminNavEntry } from '#core/types/nav';

/** Admin navigation entries contributed by the logging domain. */
export const loggingNavEntries: AdminNavEntry[] = [
	{
		label: 'log.admin.value',
		icon: 'ScrollText',
		route: 'admin.log.logs.render',
		permission: permissions.logs.view,
		category: 'settings',
	},
];
