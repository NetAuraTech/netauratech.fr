import { BaseCommand } from '@adonisjs/core/ace';
import { MaintenanceService } from '#core/services/maintenance_service';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * ACE command to show maintenance mode status.
 *
 * Usage:
 * node ace maintenance:status
 */
export default class MaintenanceStatus extends BaseCommand {
	static commandName = 'maintenance:status';
	static description = 'Show current maintenance mode status';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	async run() {
		const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService);

		const config = await maintenanceService.getEffectiveConfig();
		const memoryConfig = maintenanceService.getMemoryConfig();
		const redisAvailable = maintenanceService.isRedisAvailable();

		this.logger.info('═══════════════════════════════');
		this.logger.info('  Maintenance Mode Status');
		this.logger.info('═══════════════════════════════');

		const statusLabel = config.enabled ? 'ENABLED' : 'DISABLED';
		const statusColor = config.enabled ? 'error' : 'success';
		this.logger[statusColor](`Status: ${statusLabel}`);

		this.logger.info(`Source: ${config.source === 'redis' ? 'Redis' : 'Memory fallback'}`);
		this.logger.info(`Redis available: ${redisAvailable ? 'Yes' : 'No'}`);

		if (config.enabled && config.message) {
			this.logger.info(`Message: ${config.message}`);
		}

		if (config.allowedIps.length > 0) {
			this.logger.info('Allowed IPs:');
			config.allowedIps.forEach((ip) => this.logger.info(`  - ${ip}`));
		} else {
			this.logger.info('Allowed IPs: (none)');
		}

		this.logger.info(`Retry-After: ${config.retryAfter}s`);

		if (config.scheduled) {
			this.logger.info(`Scheduled window: ${config.scheduled.enabled ? 'ENABLED' : 'DISABLED'}`);
			if (config.scheduled.startAt) {
				this.logger.info(`  Start: ${config.scheduled.startAt}`);
			}
			if (config.scheduled.endAt) {
				this.logger.info(`  End: ${config.scheduled.endAt}`);
			}
		}

		if (memoryConfig && memoryConfig._explicitlySet) {
			this.logger.warning('');
			this.logger.warning('⚠️  Memory fallback is explicitly set (admin modified during Redis outage)');
			this.logger.warning(`Last updated: ${memoryConfig.updatedAt.toISOString()}`);
		}

		if (!redisAvailable) {
			this.logger.warning('');
			this.logger.warning('⚠️  WARNING: Running on memory fallback. Changes lost on restart.');
		}
	}
}
