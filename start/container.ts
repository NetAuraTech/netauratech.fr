import app from '@adonisjs/core/services/app'
import { BackupEngine } from '#services/backup/backup_engine'
import { CacheService } from '#services/cache/cache_service'
import { RedisCacheDriver } from '#services/cache/drivers/redis_cache_driver'
import { LogService } from '#services/logging/log_service'
import { MaintenanceService } from '#services/maintenance/maintenance_service'

/**
 * IoC container bindings.
 *
 * Singleton services are instantiated exactly once per process and reused
 * across every request — which is what makes in-flight state (locks,
 * sessions) work correctly without serialising to a database on every call.
 * Factory bindings are re-created on each resolution with runtime arguments
 * supplied via {@link app.container.make}.
 *
 * Add this file to `adonisrc.ts` preloads if it isn't already:
 *
 * @example
 * // adonisrc.ts
 * preloads: [
 *   () => import('#start/container'),
 * ]
 */

// ─── BackupEngine (factory) ────────────────────────────────────────────

/**
 * Factory binding for {@link BackupEngine} so that callers can resolve it
 * through the container instead of using `new`. Runtime arguments
 * (`strategyType`, `tempDir`) are supplied at resolution time which keeps
 * the strategy dynamic while still being mockable in tests via
 * {@link app.container.swap}.
 *
 * @example
 * const engine = await app.container.make(BackupEngine, ['full', 'storage/temp/backups'])
 */
app.container.bind(BackupEngine, async (resolver, runtimeValues) => {
  const [strategyType, tempDir] = runtimeValues ?? []
  const logService = await resolver.make(LogService)
  return new BackupEngine(strategyType, tempDir, logService)
})

// ─── CacheService (singleton) ──────────────────────────────────────────

/**
 * The root `CacheService` backed by Redis.
 * Inject or resolve via the container anywhere in the app:
 *
 * @example
 * // In a service or controller
 * const cache = await app.container.make(CacheService)
 */
app.container.singleton(CacheService, () => {
  const driver = new RedisCacheDriver()
  return new CacheService(driver)
})

// ─── MaintenanceService (singleton) ────────────────────────────────────

/**
 * Maintenance service singleton.
 * Handles Redis + memory fallback for maintenance mode configuration.
 * Initializes memory fallback on first resolution.
 */
app.container.singleton(MaintenanceService, async () => {
  const service = MaintenanceService.getInstance()
  await service.initializeMemoryFallback()
  return service
})
