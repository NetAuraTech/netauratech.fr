import { permissions } from '#start/permissions';
import type { AdminNavEntry } from '#core/types/nav';

/** Admin navigation entries contributed by the file domain. */
export const fileNavEntries: AdminNavEntry[] = [
	{
		label: 'file.admin.files.value',
		icon: 'Folder',
		route: 'admin.file.files.render',
		permission: permissions.files.view,
		category: 'content',
	},
];
