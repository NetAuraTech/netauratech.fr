import { BaseQuery, type PaginatedResult } from '#core/queries/base_query';
import LogEntry from '#log/models/log_entry';
import type { LogEntry as LogEntryDomain } from '#log/domain/log_entry';
import type { LogEntryListFilters } from '#log/types/logging';

/**
 * Read-side query for listing persisted log entries for the admin log viewer,
 * newest first, with optional filters.
 */
export class ListLogEntriesQuery extends BaseQuery {
	/**
	 * Execute the log entry listing query.
	 *
	 * All filters combine with AND. The result is always ordered by
	 * `created_at` descending (most recent first).
	 *
	 * @param filters - Optional level, category, search, actor and date-range
	 *   filters plus pagination parameters.
	 * @returns A paginated result set of {@link LogEntryDomain} records, newest first.
	 *
	 * @example
	 * const result = await listLogEntriesQuery.execute({ level: LogLevel.ERROR, page: 1 })
	 */
	async execute(filters: LogEntryListFilters = {}): Promise<PaginatedResult<LogEntryDomain>> {
		const query = LogEntry.query(this.client()).orderBy('created_at', 'desc');

		if (filters.level) {
			query.where('level', filters.level);
		}

		if (filters.category) {
			query.where('category', filters.category);
		}

		if (filters.search) {
			query.whereILike('message', `%${filters.search}%`);
		}

		if (filters.actorId !== undefined) {
			query.where('actor_id', filters.actorId);
		}

		if (filters.from) {
			query.where('created_at', '>=', filters.from.toSQL()!);
		}

		if (filters.to) {
			query.where('created_at', '<=', filters.to.toSQL()!);
		}

		const result = await query.paginate(filters.page ?? 1, filters.perPage ?? 20);

		return this.toPaginated(result, (row) => row.toDomain());
	}
}
