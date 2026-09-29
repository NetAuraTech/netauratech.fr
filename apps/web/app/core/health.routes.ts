import router from '@adonisjs/core/services/router';
import { controllers } from '#generated/controllers';

/**
 * Health check routes - registered OUTSIDE maintenance middleware
 * These endpoints must remain accessible during maintenance for:
 * - Load balancer liveness probes (/health)
 * - Load balancer readiness probes (/health/ready)
 *
 * This is a standalone registration (not part of the self-registering core
 * surfaces) because the maintenance wrapper must never see the probe
 * endpoints; `start/routes.ts` calls it before the wrapper group.
 */
export function registerCoreHealthRoutes(): void {
	router.get('/health', [controllers.core.Health, 'liveness']).as('health.liveness');
	router.get('/health/ready', [controllers.core.Health, 'readiness']).as('health.readiness');
}
