import * as Sentry from '@sentry/node';
import type { SentryConfig } from '#config/sentry';
import type { ApplicationService } from '@adonisjs/core/types';

/**
 * Boots the Sentry SDK with the application's `sentry` config.
 *
 * The client is created lazily by the SDK on first use, but the
 * initialization itself happens once during the application boot.
 * Error reporting stays a no-op when `sentry.enabled` is falsy
 * (e.g. local development and the test environment).
 */
export default class SentryProvider {
	/**
	 * The application service used to resolve the registered
	 * `sentry` config file during boot.
	 */
	constructor(protected app: ApplicationService) {}

	/**
	 * Initialize the Sentry SDK when the `sentry` config enables it.
	 * A missing config file is treated as a disabled integration.
	 */
	async boot() {
		const config = this.app.config.get<SentryConfig>('sentry', {});

		if (config.enabled) {
			Sentry.init(config);
		}
	}
}
