import app from '@adonisjs/core/services/app';
import { BackupEngine } from '#backup/services/backup_engine';
import { MaintenanceService } from '#core/services/maintenance_service';
import { LogService } from '#log/services/log_service';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { RedisCacheDriver } from '#shared/services/cache/drivers/redis_cache_driver';
import { CacheService } from '#shared/services/cache_service';
import { LockService } from '#shared/services/lock_service';

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
	const [strategyType, tempDir] = runtimeValues ?? [];
	const logService = await resolver.make(LogService);
	return new BackupEngine(strategyType, tempDir, logService);
});

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
	const driver = new RedisCacheDriver();
	return new CacheService(driver);
});

// ─── InMemoryCacheDriver (singleton) ──────────────────────────────────────────

/**
 * In-memory {@link CacheDriver} implementation singleton, for tests and
 * single-process environments. The production {@link CacheService} binding
 * above stays on Redis; resolve or swap this driver through the container
 * wherever the contract is needed.
 *
 * @example
 * const driver = await app.container.make(InMemoryCacheDriver)
 * const cache = new CacheService(driver).namespace('builder')
 */
app.container.singleton(InMemoryCacheDriver, () => new InMemoryCacheDriver());

// ─── LockService (singleton) ──────────────────────────────────────────────

/**
 * Distributed lock service singleton.
 * Shared across every request and job execution so a maintenance task never
 * runs twice at once. Uses Redis with an in-memory fallback.
 *
 * @example
 * const locks = await app.container.make(LockService)
 * await locks.withLock('maintenance:log_prune', 1800, () => runPrune())
 */
app.container.singleton(LockService, () => new LockService());

// ─── MaintenanceService (singleton) ────────────────────────────────────

/**
 * Maintenance service singleton.
 * Handles Redis + memory fallback for maintenance mode configuration.
 * Initializes memory fallback on first resolution.
 */
app.container.singleton(MaintenanceService, async () => {
	const service = MaintenanceService.getInstance();
	await service.initializeMemoryFallback();
	return service;
});
