import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

/**
 * Health check routes - registered OUTSIDE maintenance middleware
 * These endpoints must remain accessible during maintenance for:
 * - Load balancer liveness probes (/health)
 * - Load balancer readiness probes (/health/ready)
 */
export function registerHealthRoutes(): void {
  router.get('/health', [controllers.health.Health, 'liveness']).as('health.liveness')
  router.get('/health/ready', [controllers.health.Health, 'readiness']).as('health.readiness')
}
