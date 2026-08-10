import LogEntry from '#models/core/log_entry'
import type { CreateLogEntryInput, LogEntryListFilters } from '#types/logging'
import type { DateTime } from 'luxon'
import { BaseRepository } from '#repositories/base_repository'

/**
 * Handles all database operations for the {@link LogEntry} model.
 *
 * Owns the persistence side of the logging pipeline (write-through inserts)
 * and the read side used by the admin log viewer, plus retention pruning.
 */
export class LogEntryRepository extends BaseRepository {
  /**
   * Audit queries never join the ambient transaction: persistence is
   * fire-and-forget and may resolve after the caller's transaction has
   * committed (dead client), and audit entries must survive rollbacks.
   */
  protected override client() {
    return undefined
  }

  /**
   * Persists a single log entry row.
   *
   * @param input - The normalised log entry to persist.
   * @returns The newly created {@link LogEntry}.
   *
   * @example
   * const entry = await logEntryRepository.createRecord({ level, category, message })
   */
  async createRecord(input: CreateLogEntryInput): Promise<LogEntry> {
    return LogEntry.create(
      {
        level: input.level,
        category: input.category,
        message: input.message,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
        requestId: input.requestId ?? null,
        context: input.context ?? null,
        error: input.error ?? null,
      },
      this.client()
    )
  }

  /**
   * Returns log entries matching the given filters, newest first, paginated.
   *
   * All filters combine with AND. The result is always ordered by
   * `created_at` descending (most recent first).
   *
   * @param filters - Optional level, category, search, actor and date-range
   *   filters plus pagination parameters.
   * @returns A paginated result set of {@link LogEntry} records.
   *
   * @example
   * const result = await logEntryRepository.listPaginated({ level: LogLevel.ERROR, page: 1 })
   */
  async listPaginated(filters: LogEntryListFilters = {}) {
    const query = LogEntry.query(this.client()).orderBy('created_at', 'desc')

    if (filters.level) {
      query.where('level', filters.level)
    }

    if (filters.category) {
      query.where('category', filters.category)
    }

    if (filters.search) {
      query.whereILike('message', `%${filters.search}%`)
    }

    if (filters.actorId !== undefined) {
      query.where('actor_id', filters.actorId)
    }

    if (filters.from) {
      query.where('created_at', '>=', filters.from.toSQL()!)
    }

    if (filters.to) {
      query.where('created_at', '<=', filters.to.toSQL()!)
    }

    return query.paginate(filters.page ?? 1, filters.perPage ?? 20)
  }

  /**
   * Counts entries created before the given date.
   *
   * Used for the `--dry-run` mode of the `logs:prune` command.
   *
   * @param before - Entries strictly older than this date are counted.
   * @returns The number of matching entries.
   *
   * @example
   * const count = await logEntryRepository.countOlderThan(DateTime.now().minus({ days: 30 }))
   */
  async countOlderThan(before: DateTime): Promise<number> {
    const result = await LogEntry.query(this.client())
      .where('created_at', '<', before.toSQL()!)
      .count('* as total')
    return Number(result[0].$extras.total)
  }

  /**
   * Deletes entries created before the given date.
   *
   * @param before - Entries strictly older than this date are deleted.
   * @returns The number of deleted rows.
   *
   * @example
   * const deleted = await logEntryRepository.deleteOlderThan(DateTime.now().minus({ days: 30 }))
   */
  async deleteOlderThan(before: DateTime): Promise<number> {
    const deleted = await LogEntry.query(this.client())
      .where('created_at', '<', before.toSQL()!)
      .delete()
    return deleted as unknown as number
  }

  /**
   * Counts how many entries exceed a soft cap on the number of rows kept.
   *
   * Used for the dry-run mode of the `logs:prune` command when enforcing
   * the `persistence.maxEntries` configuration.
   *
   * @param keep - The maximum number of newest entries to keep.
   * @returns The number of entries that would be deleted (never negative).
   *
   * @example
   * const excess = await logEntryRepository.countBeyondNewest(100_000)
   */
  async countBeyondNewest(keep: number): Promise<number> {
    const result = await LogEntry.query(this.client()).count('* as total')
    return Math.max(0, Number(result[0].$extras.total) - keep)
  }

  /**
   * Deletes the oldest entries so that at most `keep` rows remain.
   *
   * The newest `keep` entries (by `created_at`, then `id`) are preserved;
   * everything older is deleted.
   *
   * @param keep - The maximum number of newest entries to keep.
   * @returns The number of deleted rows.
   *
   * @example
   * const deleted = await logEntryRepository.deleteOldestBeyond(100_000)
   */
  async deleteOldestBeyond(keep: number): Promise<number> {
    const newest = LogEntry.query(this.client())
      .select('id')
      .orderBy('created_at', 'desc')
      .orderBy('id', 'desc')
      .limit(keep)

    const deleted = await LogEntry.query(this.client()).whereNotIn('id', newest).delete()
    return deleted as unknown as number
  }
}
