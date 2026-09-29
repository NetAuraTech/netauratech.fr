import app from '@adonisjs/core/services/app';
import { test } from '@japa/runner';
import loggingConfig from '#config/logging';
import { PruneLogEntriesJob } from '#log/jobs/prune_log_entries_job';
import { LockService } from '#shared/services/lock_service';
import type { JobContext } from '@adonisjs/queue/types';

const context: JobContext = {
	jobId: 'test-job-id',
	name: 'PruneLogEntriesJob',
	attempt: 1,
	queue: 'maintenance',
	priority: 5,
	acquiredAt: new Date(),
	stalledCount: 0,
};

/**
 * Unit seam for {@link PruneLogEntriesJob}: the scheduled worker-side half of
 * log-entry retention. `execute()` runs {@link PruneLogEntriesAction} with the
 * configured window and cap, but only while holding the maintenance lock;
 * `failed()` records a business event once retries are exhausted.
 */
test.group('PruneLogEntriesJob', () => {
	test('targets the maintenance queue with a bounded timeout', ({ assert }) => {
		assert.equal(PruneLogEntriesJob.options.queue, 'maintenance');
		assert.exists(PruneLogEntriesJob.options.timeout);
	});

	test('execute() runs the prune action with the configured window and cap when the lock is free', async ({
		assert,
	}) => {
		const job = await app.container.make(PruneLogEntriesJob);
		job.$hydrate({}, context);

		let captured: { days?: number; maxEntries?: number } | undefined;
		(job as unknown as { pruneLogEntriesAction: unknown }).pruneLogEntriesAction = {
			execute: (payload: { days: number; maxEntries?: number }) => {
				captured = payload;
				return Promise.resolve({ count: 0, dateCount: 0, capCount: 0, dryRun: false });
			},
		};

		await job.execute();

		assert.equal(captured?.days, loggingConfig.persistence.retentionDays);
		assert.equal(captured?.maxEntries, loggingConfig.persistence.maxEntries);
	});

	test('execute() is a no-op when the maintenance lock is already held', async ({ assert }) => {
		const lockService = await app.container.make(LockService);
		const token = await lockService.acquire('maintenance:log_prune', 30);

		try {
			const job = await app.container.make(PruneLogEntriesJob);
			job.$hydrate({}, context);

			let actionCalled = false;
			(job as unknown as { pruneLogEntriesAction: unknown }).pruneLogEntriesAction = {
				execute: () => {
					actionCalled = true;
					return Promise.resolve({});
				},
			};

			await job.execute();
			assert.isFalse(actionCalled);
		} finally {
			if (token) await lockService.release('maintenance:log_prune', token);
		}
	});

	test('failed() records a business event', async ({ assert }) => {
		const job = await app.container.make(PruneLogEntriesJob);
		job.$hydrate({}, context);

		const calls: { event: string; metadata: Record<string, unknown> }[] = [];
		(job as unknown as { logService: unknown }).logService = {
			logBusiness: (event: string, _context: Record<string, unknown>, metadata: Record<string, unknown>) => {
				calls.push({ event, metadata });
			},
		};

		await job.failed(new Error('db down'));

		assert.equal(calls.length, 1);
		assert.equal(calls[0].event, 'logs.prune.scheduled_failed');
		assert.equal(calls[0].metadata.error, 'db down');
	});
});
