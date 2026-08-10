import { inject } from '@adonisjs/core'
import { DateTime } from 'luxon'
import { LogEntryRepository } from '#repositories/logging/log_entry_repository'
import { LogService } from '#services/logging/log_service'

interface PruneLogEntriesPayload {
  /** Entries older than this many days are pruned. */
  days: number
  /**
   * Optional soft cap on the number of rows kept in the table. When set,
   * the oldest entries beyond this count are pruned after the date-based
   * prune (see `persistence.maxEntries` in `config/logging.ts`).
   */
  maxEntries?: number
  /** When `true`, only count the entries that would be pruned — delete nothing. */
  dryRun?: boolean
}

interface PruneLogEntriesResult {
  /** Total number of entries pruned (or that would be pruned in dry-run mode). */
  count: number
  /** Number of entries pruned by the date-based retention window. */
  dateCount: number
  /** Number of entries pruned by the `maxEntries` soft cap. */
  capCount: number
  /** The cutoff date used for pruning. */
  cutoff: DateTime
  /** Whether the run was a dry run (no rows deleted). */
  dryRun: boolean
}

/**
 * Prune log entries older than a given retention window.
 *
 * Used by the `logs:prune` Ace command to enforce the retention policy.
 * The prune itself is logged as a business event so the operation leaves
 * an audit trail.
 */
@inject()
export class PruneLogEntriesAction {
  constructor(
    protected logEntryRepository: LogEntryRepository,
    protected logService: LogService
  ) {}

  /**
   * Execute the prune.
   *
   * @param payload - Retention window in days and dry-run flag.
   * @returns The number of pruned (or would-be pruned) entries and the cutoff used.
   *
   * @example
   * const result = await pruneLogEntriesAction.execute({ days: 30 })
   */
  async execute(payload: PruneLogEntriesPayload): Promise<PruneLogEntriesResult> {
    const cutoff = DateTime.now().minus({ days: payload.days })
    const dryRun = payload.dryRun ?? false

    const dateCount = dryRun
      ? await this.logEntryRepository.countOlderThan(cutoff)
      : await this.logEntryRepository.deleteOlderThan(cutoff)

    let capCount = 0
    if (payload.maxEntries !== undefined) {
      capCount = dryRun
        ? await this.logEntryRepository.countBeyondNewest(payload.maxEntries)
        : await this.logEntryRepository.deleteOldestBeyond(payload.maxEntries)
    }

    const count = dateCount + capCount

    this.logService.logBusiness(
      dryRun ? 'logs.prune.dry_run' : 'logs.pruned',
      {},
      {
        days: payload.days,
        cutoff: cutoff.toISO(),
        maxEntries: payload.maxEntries,
        dateCount,
        capCount,
        count,
      }
    )

    return { count, dateCount, capCount, cutoff, dryRun }
  }
}
