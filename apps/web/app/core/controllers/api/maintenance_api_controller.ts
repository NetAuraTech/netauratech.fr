import { inject } from '@adonisjs/core';
import MaintenanceResource from '#transport/core/rest/maintenance_resource';
import { handle } from '#transport/core/rest/rest_adapter';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * GET /api/v1/admin/maintenance — current maintenance configuration and
 * effective runtime state.
 * PUT /api/v1/admin/maintenance — update maintenance configuration.
 * PUT /api/v1/admin/maintenance/toggle — toggle maintenance mode on/off.
 *
 * Thin transport adapters over the `index`, `update` and `toggle` endpoints
 * of the {@link MaintenanceResource}; the endpoint declarations are executed
 * by the shared REST pipeline.
 */
@inject()
export default class MaintenanceApiController {
	constructor(protected maintenanceResource: MaintenanceResource) {}

	async index(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.maintenanceResource.endpoints.index);
	}

	async update(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.maintenanceResource.endpoints.update);
	}

	async toggle(ctx: HttpContext): Promise<void> {
		await handle(ctx, this.maintenanceResource.endpoints.toggle);
	}
}
