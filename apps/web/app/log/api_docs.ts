import { LogCategory, LogLevel } from '#log/types/logging';
import { registerApiDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { dateTime, validationErrorSchema, paginatedEnvelope } from '#transport/core/openapi/schemas';
import { listLogsValidator } from '#transport/log/validators/log';

/** The log entry payload, as shaped by `LogEntryTransformer`. */
const logEntrySchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number', nullable: true },
		level: { type: 'string', enum: Object.values(LogLevel) },
		category: { type: 'string', enum: Object.values(LogCategory) },
		message: { type: 'string' },
		actorId: { type: 'number', nullable: true },
		actorEmail: { type: 'string', nullable: true },
		ip: { type: 'string', nullable: true },
		userAgent: { type: 'string', nullable: true },
		requestId: { type: 'string', nullable: true },
		context: { type: 'object', nullable: true },
		error: { type: 'object', nullable: true },
		createdAt: dateTime,
	},
};

/**
 * Register the docs metadata of the log REST surface (read-only log listing)
 * under its full route name.
 *
 * Called from `app/log/controllers/api/routes.ts` at import time, alongside
 * the route it documents, so the docs and the route live or die together. The
 * request schema is derived from the very same validator the endpoint
 * executes, keeping the documented shape in lockstep with the enforced one.
 */
export function registerLogApiDocs(): void {
	registerApiDoc('api.v1.admin.log.logs.index', {
		summary: 'List log entries',
		description: 'Paginated, filterable application log entries (level, category, search, actor, date range).',
		tags: ['Logs'],
		request: [{ validator: listLogsValidator, in: 'query' }],
		paginated: true,
		responses: {
			'200': { description: 'The paginated log entry list.', schema: paginatedEnvelope(logEntrySchema) },
			'422': { description: 'Validation failed.', schema: validationErrorSchema },
		},
	});
}
