import { inject } from '@adonisjs/core'
import LogEntry from '#models/core/log_entry'
import { LogEntryRepository } from '#repositories/logging/log_entry_repository'
import type { LogEntryListFilters } from '#types/logging'

/**
 * List persisted log entries for the admin log viewer, with optional filters.
 */
@inject()
export class ListLogEntriesAction {
  constructor(protected logEntryRepository: LogEntryRepository) {}

  /**
   * Execute the log entry listing.
   *
   * @param filters - Optional level, category, search, actor and date-range
   *   filters plus pagination parameters.
   * @returns A paginated result set of {@link LogEntry} records, newest first.
   *
   * @example
   * const result = await listLogEntriesAction.execute({ level: LogLevel.ERROR, page: 1 })
   */
  async execute(filters: LogEntryListFilters = {}) {
    return this.logEntryRepository.listPaginated(filters)
  }
}
