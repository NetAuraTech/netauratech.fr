import { authApiClient } from '@adonisjs/auth/plugins/api_client';
import app from '@adonisjs/core/services/app';
import testUtils from '@adonisjs/core/services/test_utils';
import limiter from '@adonisjs/limiter/services/main';
import { sessionApiClient } from '@adonisjs/session/plugins/api_client';
import { shieldApiClient } from '@adonisjs/shield/plugins/api_client';
import { apiClient } from '@japa/api-client';
import { assert } from '@japa/assert';
import { pluginAdonisJS } from '@japa/plugin-adonisjs';
import type { Config } from '@japa/runner/types';

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
	assert(),
	pluginAdonisJS(app),
	apiClient(),
	sessionApiClient(app),
	authApiClient(app),
	shieldApiClient(),
];

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
	setup: [() => testUtils.db().migrate()],
	teardown: [],
};

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
	if (['functional', 'e2e'].includes(suite.name)) {
		return suite
			.setup(() => testUtils.httpServer().start())
			.onTest(async () => {
				// Clear limiter stores before each test to avoid rate limiting from previous tests
				try {
					await limiter.clear();
				} catch {}
			})
			.onGroup((group) => {
				group.teardown(async () => {
					// Clear limiter stores after each test group to avoid rate limiting issues
					try {
						await limiter.clear();
					} catch {}
				});
			})
			.teardown(async () => {
				// Clear limiter stores after each test suite to avoid rate limiting issues
				try {
					await limiter.clear();
				} catch {}
			});
	}
};

// Clear limiter stores before each test group to avoid rate limiting issues
if (app.inDev || process.env.NODE_ENV === 'test') {
	(async () => {
		try {
			const limiterManager = await app.container.make('limiter.manager');
			await limiterManager.clear();
		} catch {}
	})();
}
