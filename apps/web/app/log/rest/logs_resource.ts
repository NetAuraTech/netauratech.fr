import { inject } from '@adonisjs/core';
import { ListLogEntriesAction } from '#log/actions/log/list_log_entries_action';
import { type ApiOperationDoc, type JsonSchema } from '#transport/core/openapi/api_docs_registry';
import { dateTime, paginatedEnvelope, validationErrorSchema } from '#transport/core/openapi/schemas';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import LogEntryTransformer from '#transport/log/transformers/log_entry_transformer';
import { listLogsValidator } from '#transport/log/validators/log';
import type { Infer } from '@vinejs/vine/types';

type LogListPagination = Awaited<ReturnType<ListLogEntriesAction['execute']>>;
type LogListPayload = Infer<typeof listLogsValidator>;

/**
 * The log entry payload, as shaped by `LogEntryTransformer`. `id` is `null`
 * for entries that have not been persisted yet.
 */
export const logEntrySchema: JsonSchema = {
	type: 'object',
	properties: {
		id: { type: 'number', nullable: true },
		level: { type: 'string' },
		category: { type: 'string' },
		message: { type: 'string' },
		actorId: { type: 'number', nullable: true },
		actorEmail: { type: 'string', nullable: true },
		ip: { type: 'string', nullable: true },
		userAgent: { type: 'string', nullable: true },
		requestId: { type: 'string', nullable: true },
		context: { type: 'object' },
		error: { type: 'object', nullable: true },
		createdAt: dateTime,
	},
};

export const logsEndpointsDocs: Record<keyof LogsEndpoints, ApiOperationDoc> = {
	index: {
		summary: 'List log entries',
		description:
			'Lists log entries in reverse chronological order, newest first. Supports pagination and filtering by level, source, and time range.',
		tags: ['Logs'],
		paginated: true,
		responses: {
			'200': { description: 'Paginated list of log entries', schema: paginatedEnvelope(logEntrySchema) },
			'422': { description: 'Validation error', schema: validationErrorSchema },
		},
	},
};

/**
 * Endpoint declarations for the logs REST resource (read-only).
 */
export interface LogsEndpoints {
	index: RestEndpoint<undefined, LogListPayload, LogListPagination, LogListPagination>;
}

/**
 * Declarative logs REST resource.
 *
 * Owns the read-only logs endpoint declarations consumed by the REST
 * `handle` adapter (`#transport/core/rest/rest_adapter`); the `/api/v1/admin/logs`
 * controller reduces to a one-line dispatch over `endpoints`.
 */
@inject()
export default class LogsResource {
	constructor(protected listLogEntriesAction: ListLogEntriesAction) {}

	readonly endpoints: LogsEndpoints = {
		index: {
			docs: logsEndpointsDocs.index,
			paginated: true,
			strip: true,
			validator: () => listLogsValidator,
			execute: (context, _prepared, payload) =>
				this.listLogEntriesAction.execute({ ...payload, ...context.pagination! }),
			transform: (entity) => LogEntryTransformer.paginate(entity.all(), entity.getMeta()),
		},
	};
}
