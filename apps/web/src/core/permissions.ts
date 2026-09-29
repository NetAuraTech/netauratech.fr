/**
 * System permission catalog of the core domain: the single `admin.access`
 * slug that gates the whole administration area.
 *
 * The slug values derive from this const; the permission seeder persists
 * exactly this matrix.
 */
export const corePermissionCatalog = {
	admin: ['access'],
} as const;

/**
 * System permission catalog of the core domain's maintenance surface: the
 * maintenance-mode toggle entry of the settings surface.
 */
export const maintenancePermissionCatalog = {
	settings: ['maintenance'],
} as const;

/**
 * System role slugs of the core domain — the two roles present in every
 * flavor; the role seeder persists exactly this list.
 */
export const coreRoleSlugs = ['admin', 'user'] as const;
