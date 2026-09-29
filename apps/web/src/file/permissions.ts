/**
 * System permission catalog of the file domain: the file and folder
 * management surfaces.
 *
 * The slug values derive from this const; the permission seeder persists
 * exactly this matrix.
 */
export const filePermissionCatalog = {
	files: ['view', 'create', 'update', 'delete'],
	folders: ['view', 'create', 'update', 'delete'],
} as const;
