import app from '@adonisjs/core/services/app';
import redis from '@adonisjs/redis/services/main';
import { MaintenanceService } from '#core/services/maintenance_service';

/**
 * Maintenance state lives in Redis and persists across runs: an interrupted
 * suite (or a dev session sharing the Redis instance) can leave maintenance
 * ON and 503 every request.
 *
 * Flushes the Redis database and forces maintenance OFF so a test group starts
 * from a clean, non-degraded state.
 */
export async function resetSharedState() {
	await redis.flushdb();
	const service = await app.container.make(MaintenanceService);
	await service.setConfig({ enabled: false });
}
