import { inject } from '@adonisjs/core';
import { Job } from '@adonisjs/queue';
import { EnforceRetentionPolicyAction } from '#backup/actions/backup/enforce_retention_policy_action';
import maintenanceConfig from '#config/maintenance';
import { LogService } from '#log/services/log_service';
import { LockService } from '#shared/services/lock_service';
import type { JobOptions } from '@adonisjs/queue/types';

/**
 * Carries no data: the job always enforces the configured retention policy, so
 * there is nothing to serialise per dispatch.
 */
type EnforceBackupRetentionPayload = Record<string, never>;

/**
 * Scheduled backup retention enforcement.
 *
 * Runs the existing {@link EnforceRetentionPolicyAction} on a schedule, guarded
 * by a distributed lock so overlapping runs never double-process. Registered by
 * `start/scheduler.ts`.
 */
@inject()
export class EnforceBackupRetentionJob extends Job<EnforceBackupRetentionPayload> {
	static options: JobOptions = {
		queue: 'maintenance',
		timeout: '30m',
	};

	constructor(
		protected enforceRetentionPolicyAction: EnforceRetentionPolicyAction,
		protected lockService: LockService,
		protected logService: LogService,
	) {
		super();
	}

	/**
	 * Acquire the maintenance lock and enforce retention if (and only if) the
	 * lock is free. When a previous run still holds the lock the job is a
	 * no-op.
	 */
	async execute(): Promise<void> {
		await this.lockService.withLock('maintenance:backup_retention', maintenanceConfig.lockTtlSeconds, async () => {
			await this.enforceRetentionPolicyAction.execute();
		});
	}

	/**
	 * Record a business event once the scheduled retention run has permanently
	 * failed after all configured retries.
	 *
	 * @param error - The error thrown by the last attempt.
	 */
	async failed(error: Error): Promise<void> {
		this.logService.logBusiness('backup.retention.scheduled_failed', {}, { error: error.message });
	}
}

export default EnforceBackupRetentionJob;
