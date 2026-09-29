import features from '#config/features';
import { middleware } from '#start/kernel';

/**
 * Maintenance middleware gate shared by every domain route module: wraps with
 * the maintenance middleware (when the `maintenance` feature flag is enabled)
 * before the domain's auth guards. Empty array when the flag is off, so
 * `[...maintenanceMiddleware, middleware.auth(...)]` spreads cleanly either way.
 */
export const maintenanceMiddleware = features.maintenance ? [middleware.maintenance()] : [];
