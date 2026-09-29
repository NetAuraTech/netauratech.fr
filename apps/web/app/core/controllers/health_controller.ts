import { inject } from '@adonisjs/core';
import db from '@adonisjs/lucid/services/db';
import redis from '@adonisjs/redis/services/main';
import { MaintenanceService } from '#core/services/maintenance_service';
import type { HttpContext } from '@adonisjs/core/http';

@inject()
export default class HealthController {
	constructor(protected maintenanceService: MaintenanceService) {}
	/**
	 * Liveness probe - basic server health
	 * Used by load balancers to determine if the process is alive
	 */
	async liveness({ response }: HttpContext) {
		return response.ok({
			status: 'ok',
			timestamp: new Date().toISOString(),
			maintenance: false, // Always false for liveness
		});
	}

	/**
	 * Readiness probe - checks dependencies (DB, Redis) + maintenance status
	 * Used by load balancers to determine if the app can serve traffic
	 */
	async readiness({ response }: HttpContext) {
		const maintenanceConfig = await this.maintenanceService.getConfig();

		const checks = await Promise.allSettled([this.checkDatabase(), this.checkRedis()]);

		const dbCheck = checks[0];
		const redisCheck = checks[1];

		const isReady = dbCheck.status === 'fulfilled' && redisCheck.status === 'fulfilled';

		if (!isReady) {
			return response.status(503).send({
				status: 'not ready',
				timestamp: new Date().toISOString(),
				maintenance: maintenanceConfig.enabled,
				maintenanceMessage: maintenanceConfig.enabled ? maintenanceConfig.message : undefined,
				checks: {
					database: dbCheck.status === 'fulfilled' ? 'ok' : 'failed',
					redis: redisCheck.status === 'fulfilled' ? 'ok' : 'failed',
				},
			});
		}

		return response.ok({
			status: 'ready',
			timestamp: new Date().toISOString(),
			maintenance: maintenanceConfig.enabled,
			maintenanceMessage: maintenanceConfig.enabled ? maintenanceConfig.message : undefined,
			checks: {
				database: 'ok',
				redis: 'ok',
			},
		});
	}

	private async checkDatabase(): Promise<void> {
		await db.rawQuery('SELECT 1');
	}

	private async checkRedis(): Promise<void> {
		await redis.connection().ping();
	}
}
