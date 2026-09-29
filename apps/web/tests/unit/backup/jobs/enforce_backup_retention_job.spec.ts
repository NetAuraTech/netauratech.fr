import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import { EnforceBackupRetentionJob } from '#backup/jobs/enforce_backup_retention_job';
import { LockService } from '#shared/services/lock_service';
import type { JobContext } from '@adonisjs/queue/types';

const context: JobContext = {
	jobId: 'test-job-id',
	name: 'EnforceBackupRetentionJob',
	attempt: 1,
	queue: 'maintenance',
	priority: 5,
	acquiredAt: new Date(),
	stalledCount: 0,
};

/**
 * Unit seam for {@link EnforceBackupRetentionJob}: the scheduled worker-side
 * half of backup retention. `execute()` runs the existing
 * {@link EnforceRetentionPolicyAction} only while holding the maintenance lock;
 * `failed()` records a business event once retries are exhausted.
 */
test.group('EnforceBackupRetentionJob', () => {
	test('targets the maintenance queue with a bounded timeout', ({ assert }) => {
		assert.equal(EnforceBackupRetentionJob.options.queue, 'maintenance');
		assert.exists(EnforceBackupRetentionJob.options.timeout);
	});

	test('execute() runs the retention action when the lock is free', async ({ assert }) => {
		const job = await app.container.make(EnforceBackupRetentionJob);
		job.$hydrate({}, context);

		let actionCalled = false;
		(job as unknown as { enforceRetentionPolicyAction: unknown }).enforceRetentionPolicyAction = {
			execute: () => {
				actionCalled = true;
				return Promise.resolve({ deleted: [], kept: 0 });
			},
		};

		await job.execute();
		assert.isTrue(actionCalled);
	});

	test('execute() is a no-op when the maintenance lock is already held', async ({ assert }) => {
		const lockService = await app.container.make(LockService);
		const token = await lockService.acquire('maintenance:backup_retention', 30);

		try {
			const job = await app.container.make(EnforceBackupRetentionJob);
			job.$hydrate({}, context);

			let actionCalled = false;
			(job as unknown as { enforceRetentionPolicyAction: unknown }).enforceRetentionPolicyAction = {
				execute: () => {
					actionCalled = true;
					return Promise.resolve({});
				},
			};

			await job.execute();
			assert.isFalse(actionCalled);
		} finally {
			if (token) await lockService.release('maintenance:backup_retention', token);
		}
	});

	test('failed() records a business event', async ({ assert }) => {
		const job = await app.container.make(EnforceBackupRetentionJob);
		job.$hydrate({}, context);

		const calls: { event: string; metadata: Record<string, unknown> }[] = [];
		(job as unknown as { logService: unknown }).logService = {
			logBusiness: (event: string, _context: Record<string, unknown>, metadata: Record<string, unknown>) => {
				calls.push({ event, metadata });
			},
		};

		await job.failed(new Error('drive down'));

		assert.equal(calls.length, 1);
		assert.equal(calls[0].event, 'backup.retention.scheduled_failed');
		assert.equal(calls[0].metadata.error, 'drive down');
	});
});
