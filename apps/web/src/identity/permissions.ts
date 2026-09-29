/**
 * System permission catalog of the identity domain: the user, role and
 * permission management surfaces.
 *
 * The slug values derive from this const; the permission seeder persists
 * exactly this matrix.
 */
export const identityPermissionCatalog = {
	users: ['view', 'create', 'update', 'delete', 'manage_roles'],
	roles: ['view', 'create', 'update', 'delete', 'manage_permissions'],
	permissions: ['view', 'create', 'update', 'delete'],
} as const;
