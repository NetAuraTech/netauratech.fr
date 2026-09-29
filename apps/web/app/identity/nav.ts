import { permissions } from '#start/permissions';
import type { AdminNavEntry } from '#core/types/nav';

/** Admin navigation entries contributed by the identity domain. */
export const identityNavEntries: AdminNavEntry[] = [
	{
		label: 'identity.admin.users.value',
		icon: 'Users',
		route: 'admin.identity.users.render',
		permission: permissions.users.view,
		category: 'access_control',
	},
	{
		label: 'identity.admin.roles.value',
		icon: 'ShieldCheck',
		route: 'admin.identity.roles.render',
		permission: permissions.roles.view,
		category: 'access_control',
	},
	{
		label: 'identity.admin.permissions.value',
		icon: 'KeyRound',
		route: 'admin.identity.permissions.render',
		permission: permissions.permissions.view,
		category: 'access_control',
	},
];
