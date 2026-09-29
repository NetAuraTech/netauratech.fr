import { test } from '@japa/runner';
import * as Sentry from '@sentry/node';
import SentryProvider from '#providers/sentry_provider';
import type { SentryConfig } from '#config/sentry';
import type { ApplicationService } from '@adonisjs/core/types';

/**
 * Unit tests for `SentryProvider`.
 *
 * Exercises the real `@sentry/node` SDK: the provider's `boot()` runs against
 * a stubbed application config and the assertions inspect the client the SDK
 * actually creates. No events are ever captured (so nothing is sent), and the
 * SDK's current client is reset in teardown so initialization cannot leak into
 * other suites running in the same process.
 */
test.group('SentryProvider', (group) => {
	group.each.teardown(() => {
		Sentry.getCurrentScope().setClient(undefined);
	});

	/**
	 * Builds a minimal application stand-in exposing only the config service
	 * that `SentryProvider` reads during `boot()`.
	 *
	 * @param config - The sentry config the stubbed `config.get` returns
	 */
	function makeApp(config: SentryConfig): ApplicationService {
		return {
			config: {
				get: () => config,
			},
		} as unknown as ApplicationService;
	}

	test('boot() initializes the SDK with the sentry config when enabled', async ({ assert }) => {
		const config: SentryConfig = {
			enabled: true,
			environment: 'production',
			dsn: 'https://public@o1.ingest.sentry.io/1',
			integrations: [],
			tracesSampleRate: 0.1,
		};

		await new SentryProvider(makeApp(config)).boot();

		const client = Sentry.getClient();

		assert.exists(client);
		assert.equal(client?.getOptions().dsn, config.dsn);
		assert.equal(client?.getOptions().environment, config.environment);
		assert.equal(client?.getOptions().tracesSampleRate, config.tracesSampleRate);
	});

	test('boot() leaves the SDK uninitialized when disabled', async ({ assert }) => {
		const config: SentryConfig = {
			enabled: false,
			environment: 'production',
			dsn: 'https://public@o1.ingest.sentry.io/1',
			integrations: [],
			tracesSampleRate: 0.1,
		};

		await new SentryProvider(makeApp(config)).boot();

		assert.isNotOk(Sentry.getClient(), 'the SDK client should not be initialized');
	});
});
