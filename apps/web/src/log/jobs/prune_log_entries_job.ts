import { inject } from '@adonisjs/core';
import { Job } from '@adonisjs/queue';
import loggingConfig from '#config/logging';
import maintenanceConfig from '#config/maintenance';
import { PruneLogEntriesAction } from '#log/actions/log/prune_log_entries_action';
import { LogService } from '#log/services/log_service';
import { LockService } from '#shared/services/lock_service';
import type { JobOptions } from '@adonisjs/queue/types';

/**
 * Carries no data: the job always applies the configured retention window and
 * max-entries cap, so there is nothing to serialise per dispatch.
 */
type PruneLogEntriesPayload = Record<string, never>;

/**
 * Scheduled Log Entry pruning.
 *
 * Runs the same {@link PruneLogEntriesAction} the `logs:prune` ace command
 * uses — the configured retention window plus the `persistence.maxEntries`
 * cap — but outside a request and guarded by a distributed lock so overlapping
 * runs never double-process. Registered on a schedule by `start/scheduler.ts`.
 */
@inject()
export class PruneLogEntriesJob extends Job<PruneLogEntriesPayload> {
	static options: JobOptions = {
		queue: 'maintenance',
		timeout: '30m',
	};

	constructor(
		protected pruneLogEntriesAction: PruneLogEntriesAction,
		protected lockService: LockService,
		protected logService: LogService,
	) {
		super();
	}

	/**
	 * Acquire the maintenance lock and run the prune if (and only if) the lock
	 * is free. When a previous run still holds the lock the job is a no-op.
	 */
	async execute(): Promise<void> {
		await this.lockService.withLock('maintenance:log_prune', maintenanceConfig.lockTtlSeconds, async () => {
			const { retentionDays, maxEntries } = loggingConfig.persistence;
			await this.pruneLogEntriesAction.execute({ days: retentionDays, maxEntries });
		});
	}

	/**
	 * Record a business event once the scheduled prune has permanently failed
	 * after all configured retries.
	 *
	 * @param error - The error thrown by the last attempt.
	 */
	async failed(error: Error): Promise<void> {
		this.logService.logBusiness('logs.prune.scheduled_failed', {}, { error: error.message });
	}
}

export default PruneLogEntriesJob;
