import { inject } from '@adonisjs/core';
import { ListLogEntriesQuery } from '#log/queries/list_log_entries_query';
import type { LogEntryListFilters } from '#log/types/logging';

/**
 * List persisted log entries for the admin log viewer, with optional filters.
 */
@inject()
export class ListLogEntriesAction {
	constructor(protected listLogEntriesQuery: ListLogEntriesQuery) {}

	/**
	 * Execute the log entry listing.
	 *
	 * @param filters - Optional level, category, search, actor and date-range
	 *   filters plus pagination parameters.
	 * @returns A paginated result set of log entries, newest first.
	 *
	 * @example
	 * const result = await listLogEntriesAction.execute({ level: LogLevel.ERROR, page: 1 })
	 */
	async execute(filters: LogEntryListFilters = {}) {
		return this.listLogEntriesQuery.execute(filters);
	}
}
