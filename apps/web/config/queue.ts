import { defineConfig, drivers, exponentialBackoff } from '@adonisjs/queue';
import env from '#start/env';

const queueConfig = defineConfig({
	default: env.get('QUEUE_DRIVER'),

	/**
	 * Named adapters. `redis` is the production store (atomic operations,
	 * shared by every worker process); `sync` runs jobs inline in the
	 * calling process and exists for development and the test suite, which
	 * must not require a running Redis.
	 */
	adapters: {
		redis: drivers.redis({
			connectionName: env.get('QUEUE_CONNECTION'),
		}),
		sync: drivers.sync(),
	},

	/**
	 * Worker process settings for `node ace queue:work`.
	 */
	worker: {
		concurrency: env.get('QUEUE_CONCURRENCY') ?? 5,
		idleDelay: '2s',
		stalledThreshold: '30s',
		gracefulShutdown: true,
	},

	/**
	 * Global retry policy, applied to every job unless a queue or the job
	 * itself overrides it. Exponential backoff (1s, 2s, 4s, ...) with jitter
	 * so a burst of failures does not retry in lockstep.
	 */
	retry: {
		maxRetries: env.get('QUEUE_MAX_RETRIES') ?? 3,
		backoff: exponentialBackoff({ baseDelay: '1s', maxDelay: '5m' }),
	},

	/**
	 * Job files auto-discovered and registered at boot. Jobs are domain
	 * business code and live in the owning domain module. Every listed
	 * directory is scanned, so the worker resolves scheduled jobs by name.
	 */
	locations: [
		'./src/auth/jobs/**/*.{ts,js}',
		'./src/log/jobs/**/*.{ts,js}',
		'./src/backup/jobs/**/*.{ts,js}',
		'./src/webhook/jobs/**/*.{ts,js}',
	],
});

export default queueConfig;
