import { BaseCommand, flags } from '@adonisjs/core/ace';
import { MaintenanceService } from '#core/services/maintenance_service';
import type { CommandOptions } from '@adonisjs/core/types/ace';

/**
 * ACE command to configure a scheduled maintenance window.

 * Usage:
 * node ace maintenance:schedule --start="2026-07-20T14:00:00.000Z" --end="2026-07-20T16:00:00.000Z" --message="..."
 * node ace maintenance:schedule --clear
 */
export default class MaintenanceSchedule extends BaseCommand {
	static commandName = 'maintenance:schedule';
	static description = 'Schedule a maintenance window';

	static options: CommandOptions = {
		startApp: true,
		allowUnknownFlags: false,
	};

	@flags.string({ alias: 's', description: 'Start of the window (ISO 8601)' })
	declare start?: string;

	@flags.string({ alias: 'e', description: 'End of the window (ISO 8601)' })
	declare end?: string;

	@flags.string({ alias: 'm', description: 'Maintenance message' })
	declare message?: string;

	@flags.boolean({ alias: 'c', description: 'Clear any existing schedule' })
	declare clear?: boolean;

	async run() {
		const maintenanceService: MaintenanceService = await this.app.container.make(MaintenanceService);

		if (this.clear) {
			await maintenanceService.setSchedule(null);
			this.logger.success('Scheduled maintenance window cleared');
			this.logger.info(`Source: ${maintenanceService.getSource()}`);
			return;
		}

		const startAt = this.start || (await this.prompt.ask('Start of window (ISO 8601):')) || '';
		const endAt = this.end || (await this.prompt.ask('End of window (ISO 8601):')) || '';

		const startTime = new Date(startAt).getTime();
		const endTime = new Date(endAt).getTime();

		if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
			this.logger.error('Invalid ISO 8601 date provided for --start or --end');
			this.exitCode = 1;
			return;
		}

		if (startTime >= endTime) {
			this.logger.error('The window --start must be before --end');
			this.exitCode = 1;
			return;
		}

		const message = this.message && this.message.length > 0 ? this.message.slice(0, 500) : undefined;
		const config = await maintenanceService.getConfig();

		try {
			await maintenanceService.setConfig({
				scheduled: { enabled: true, startAt, endAt },
				message: message ?? config.message,
			});

			this.logger.success('Scheduled maintenance window configured');
			this.logger.info(`Start: ${startAt}`);
			this.logger.info(`End: ${endAt}`);
			this.logger.info(`Source: ${maintenanceService.getSource()}`);
			this.logger.info('The window takes effect automatically. Use maintenance:schedule --clear to cancel it.');
		} catch (error) {
			this.logger.error(`Failed to schedule maintenance: ${error.message}`);
			this.logger.debug(error.stack);
			this.exitCode = 1;
		}
	}
}
