/**
 * System permission catalog of the logging domain: the activity-log surface.
 *
 * The slug values derive from this const; the permission seeder persists
 * exactly this matrix.
 */
export const loggingPermissionCatalog = {
	logs: ['view'],
} as const;
