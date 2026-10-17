import app from '@adonisjs/core/services/app';
import mail from '@adonisjs/mail/services/main';
import { MailClientContract, type MailClientMessage } from '#core/contracts/mail_client';
import { MaintenanceService } from '#core/services/maintenance_service';
import { FailoverCacheDriver } from '#shared/services/cache/drivers/failover_cache_driver';
import { InMemoryCacheDriver } from '#shared/services/cache/drivers/in_memory_cache_driver';
import { RedisCacheDriver } from '#shared/services/cache/drivers/redis_cache_driver';
import { CacheService } from '#shared/services/cache_service';
import { LockService } from '#shared/services/lock_service';

/**
 * Application-side mail client: a thin wrapper around the AdonisJS mail driver
 * so the kernel {@link MailClientContract} is satisfied without the kernel
 * importing the mail package.
 */
class AdonisMailClient extends MailClientContract {
	async send({ to, subject, template, data }: MailClientMessage): Promise<void> {
		await mail.send((message) => {
			message
				.to(to)
				.subject(subject)
				.htmlView(template, data ?? {});
		});
	}
}

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

// ─── CacheService (singleton) ──────────────────────────────────────────

/**
 * The root `CacheService` backed by the composite failover driver: Redis is
 * the primary tier and a process-local in-memory tier is the fallback. Each
 * operation retries Redis, so an outage degrades to process-local caching
 * instead of erroring, and recovery is self-healing (see ADR-012).
 * Inject or resolve via the container anywhere in the app:
 *
 * @example
 * // In a service or controller
 * const cache = await app.container.make(CacheService)
 */
app.container.singleton(CacheService, () => {
	const driver = new FailoverCacheDriver(new RedisCacheDriver());
	return new CacheService(driver);
});

// ─── InMemoryCacheDriver (singleton) ──────────────────────────────────────────

/**
 * In-memory {@link CacheDriver} implementation singleton, for tests and
 * single-process environments. The production {@link CacheService} binding
 * above uses a composite failover driver whose fallback tier is this same
 * class; resolve or swap this driver through the container wherever the
 * contract is needed.
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
 * runs twice at once. Locks are stored through the root {@link CacheService}
 * (composite failover driver: Redis primary, process-local fallback).
 *
 * @example
 * const locks = await app.container.make(LockService)
 * await locks.withLock('maintenance:log_prune', 1800, () => runPrune())
 */
app.container.singleton(LockService, async () => {
	const cache = await app.container.make(CacheService);
	return new LockService(cache);
});

// ─── MaintenanceService (singleton) ────────────────────────────────────

/**
 * Maintenance service singleton.
 * Stores maintenance mode configuration through the root
 * {@link CacheService} (composite failover driver: Redis primary,
 * process-local fallback) and initializes its memory fallback on first
 * resolution.
 */
app.container.singleton(MaintenanceService, async () => {
	const cache = await app.container.make(CacheService);
	const service = new MaintenanceService(cache);
	await service.initializeMemoryFallback();
	return service;
});

// ─── MailClientContract (singleton) ───────────────────────────────────

/**
 * Binds the kernel {@link MailClientContract} to the AdonisJS mail driver.
 * Every mail service resolves this through the container, keeping it
 * decoupled from the mail package.
 */
app.container.bind(MailClientContract, () => new AdonisMailClient());
