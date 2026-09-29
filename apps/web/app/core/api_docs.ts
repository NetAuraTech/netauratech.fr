import { registerApiDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { errorSchema, validationErrorSchema, dataEnvelope } from '#transport/core/openapi/schemas';
import { updateMaintenanceValidator, toggleMaintenanceValidator } from '#transport/core/validators/maintenance';

/** The stored maintenance configuration block. */
const maintenanceConfigSchema: JsonSchema = {
	type: 'object',
	properties: {
		enabled: { type: 'boolean' },
		message: { type: 'string' },
		allowedIps: { type: 'array', items: { type: 'string' } },
		retryAfter: { type: 'number' },
		scheduled: { type: 'object', nullable: true },
	},
};

/**
 * The aggregated dashboard snapshot, keyed by section: every section is
 * optional, present only when its domain registered a collector.
 */
const dashboardSchema: JsonSchema = {
	type: 'object',
	properties: {
		identity: { type: 'object', nullable: true },
		file: { type: 'object', nullable: true },
		pages: { type: 'object', nullable: true },
	},
	additionalProperties: true,
};

/** The OpenAPI document itself (the spec route documents its own payload). */
const openApiDocumentSchema: JsonSchema = {
	type: 'object',
	properties: {
		openapi: { type: 'string' },
		info: { type: 'object' },
		paths: { type: 'object' },
		components: { type: 'object' },
		tags: { type: 'array', items: { type: 'object' } },
	},
};

/**
 * Register the docs metadata of the core REST surface (dashboard,
 * maintenance, OpenAPI spec) under their full route names.
 *
 * Called from `app/core/controllers/api/routes.ts` at import time, alongside
 * the routes they document, so the docs and the routes live or die together.
 * Request schemas are derived from the very same validators the endpoints
 * execute, keeping the documented shape in lockstep with the enforced one.
 */
export function registerCoreApiDocs(): void {
	registerApiDoc('api.v1.admin.core.dashboard.index', {
		summary: 'Show the dashboard statistics',
		description: 'Aggregated, read-only snapshot of the application state, keyed by section.',
		tags: ['Dashboard'],
		responses: {
			'200': { description: 'The dashboard statistics.', schema: dataEnvelope(dashboardSchema) },
		},
	});

	registerApiDoc('api.v1.admin.core.maintenance.index', {
		summary: 'Show the maintenance configuration',
		description: 'Stored configuration, effective runtime state, and the configuration source.',
		tags: ['Maintenance'],
		responses: {
			'200': {
				description: 'The maintenance state.',
				schema: dataEnvelope({
					type: 'object',
					properties: {
						config: maintenanceConfigSchema,
						effectiveEnabled: { type: 'boolean' },
						redisAvailable: { type: 'boolean' },
						source: { type: 'string' },
					},
				}),
			},
		},
	});

	registerApiDoc('api.v1.admin.core.maintenance.update', {
		summary: 'Update the maintenance configuration',
		tags: ['Maintenance'],
		request: [{ validator: updateMaintenanceValidator, in: 'body' }],
		responses: {
			'200': {
				description: 'The updated configuration.',
				schema: dataEnvelope({
					type: 'object',
					properties: { config: maintenanceConfigSchema },
				}),
			},
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('api.v1.admin.core.maintenance.toggle', {
		summary: 'Toggle maintenance mode',
		tags: ['Maintenance'],
		request: [{ validator: toggleMaintenanceValidator, in: 'body' }],
		responses: {
			'200': {
				description: 'The new maintenance state.',
				schema: dataEnvelope({
					type: 'object',
					properties: { enabled: { type: 'boolean' } },
				}),
			},
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});

	registerApiDoc('core.openapi.spec', {
		summary: 'Show the generated OpenAPI document',
		description: "The OpenAPI 3.0 document of the API, scoped to the requesting user's permissions.",
		tags: ['OpenAPI'],
		responses: {
			'200': { description: 'The generated OpenAPI 3.0 document.', schema: openApiDocumentSchema },
			'401': { description: 'The request is not authenticated.', schema: errorSchema },
		},
	});
}
