import app from '@adonisjs/core/services/app'
import { CacheService } from '#services/cache/cache_service'
import { RedisCacheDriver } from '#services/cache/drivers/redis_cache_driver'
import { BuilderSessionService } from '#services/page/builder_session_service'

/**
 * IoC container singleton bindings.
 *
 * Services registered here are instantiated exactly once per process and
 * reused across every request — which is what makes in-flight state (locks,
 * sessions) work correctly without serialising to a database on every call.
 *
 * Add this file to `adonisrc.ts` preloads if it isn't already:
 *
 * @example
 * // adonisrc.ts
 * preloads: [
 *   () => import('#start/container'),
 * ]
 */

// ─── CacheService (singleton) ─────────────────────────────────────────────────

/**
 * The root `CacheService` backed by Redis.
 * Inject or resolve via the container anywhere in the app:
 *
 * @example
 * // In a service or controller
 * const cache = await app.container.make(CacheService)
 * const builderCache = cache.namespace('builder')
 */
app.container.singleton(CacheService, () => {
  const driver = new RedisCacheDriver()
  return new CacheService(driver)
})

// ─── BuilderSessionService (singleton) ───────────────────────────────────────

/**
 * Wires `BuilderSessionService` with the root `CacheService`.
 * Resolved as a singleton so the same instance (and same Redis connection)
 * is reused across all requests.
 */
app.container.singleton(BuilderSessionService, async () => {
  const cache = await app.container.make(CacheService)
  return new BuilderSessionService(cache)
})
