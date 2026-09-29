import { inject } from '@adonisjs/core';
import { MaintenanceService } from '#core/services/maintenance_service';
import { LogService } from '#log/services/log_service';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import { updateMaintenanceValidator, toggleMaintenanceValidator } from '#transport/core/validators/maintenance';
import type { Infer } from '@vinejs/vine/types';

type MaintenanceUpdatePayload = Infer<typeof updateMaintenanceValidator>;
type MaintenanceTogglePayload = Infer<typeof toggleMaintenanceValidator>;

type MaintenanceIndexState = Awaited<ReturnType<MaintenanceResource['buildIndexState']>>;
type MaintenanceConfigResult = Awaited<ReturnType<MaintenanceService['getConfig']>>;

/**
 * Endpoint declarations for the maintenance REST resource.
 */
export interface MaintenanceEndpoints {
	index: RestEndpoint<undefined, unknown, MaintenanceIndexState, MaintenanceIndexState>;
	update: RestEndpoint<undefined, MaintenanceUpdatePayload, MaintenanceConfigResult, MaintenanceConfigResult>;
	toggle: RestEndpoint<undefined, MaintenanceTogglePayload, { enabled: boolean }, { enabled: boolean }>;
}

/**
 * Declarative maintenance REST resource.
 *
 * Owns the maintenance endpoint declarations consumed by the REST `handle`
 * adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/maintenance` controller
 * reduces to one-line dispatch over `endpoints`.
 */
@inject()
export default class MaintenanceResource {
	constructor(
		protected maintenanceService: MaintenanceService,
		protected logService: LogService,
	) {}

	readonly endpoints: MaintenanceEndpoints = {
		index: {
			execute: () => this.buildIndexState(),
			transform: (entity) => entity,
		},
		update: {
			validator: () => updateMaintenanceValidator,
			execute: async (context, _prepared, payload) => {
				const user = context.auth.getUserOrFail();

				await this.maintenanceService.setConfig({
					enabled: payload.enabled ?? false,
					message: payload.message ?? '',
					allowedIps: payload.allowedIps ?? [],
				});

				this.logService.logBusiness(
					'settings.maintenance.updated',
					{ userId: user.id, userEmail: user.email },
					{ enabled: payload.enabled ?? false, allowedIpsCount: (payload.allowedIps ?? []).length },
				);

				return this.maintenanceService.getConfig();
			},
			transform: (entity) => ({ config: entity }),
		},
		toggle: {
			validator: () => toggleMaintenanceValidator,
			execute: async (context, _prepared, payload) => {
				const user = context.auth.getUserOrFail();

				await this.maintenanceService.toggle(payload.enabled);

				this.logService.logBusiness(
					'settings.maintenance.toggled',
					{ userId: user.id, userEmail: user.email },
					{ enabled: payload.enabled },
				);

				return { enabled: payload.enabled };
			},
			transform: (entity) => entity,
		},
	};

	/**
	 * Build the index state: stored configuration, effective runtime state and
	 * the config source.
	 */
	async buildIndexState() {
		const config = await this.maintenanceService.getConfig();
		const effectiveConfig = await this.maintenanceService.getEffectiveConfig();

		return {
			config: {
				enabled: config.enabled,
				message: config.message,
				allowedIps: config.allowedIps,
				retryAfter: config.retryAfter,
				scheduled: config.scheduled,
			},
			effectiveEnabled: effectiveConfig.enabled,
			redisAvailable: this.maintenanceService.isRedisAvailable(),
			source: this.maintenanceService.getSource(),
		};
	}
}
