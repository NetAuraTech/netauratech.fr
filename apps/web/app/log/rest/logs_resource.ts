import { inject } from '@adonisjs/core';
import { ListLogEntriesAction } from '#log/actions/log/list_log_entries_action';
import { type RestEndpoint } from '#transport/core/rest/rest_adapter';
import LogEntryTransformer from '#transport/log/transformers/log_entry_transformer';
import { listLogsValidator } from '#transport/log/validators/log';
import type { Infer } from '@vinejs/vine/types';

type LogListPagination = Awaited<ReturnType<ListLogEntriesAction['execute']>>;
type LogListPayload = Infer<typeof listLogsValidator>;

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
			paginated: true,
			strip: true,
			validator: () => listLogsValidator,
			execute: (context, _prepared, payload) =>
				this.listLogEntriesAction.execute({ ...payload, ...context.pagination! }),
			transform: (entity) => LogEntryTransformer.paginate(entity.all(), entity.getMeta()),
		},
	};
}
