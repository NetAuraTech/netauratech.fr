import app from '@adonisjs/core/services/app';
import env from '#start/env';
import type { NodeOptions } from '@sentry/node';

/**
 * Sentry SDK options for this application.
 *
 * Extends the `@sentry/node` options with the toggle used by the
 * application's Sentry provider to decide whether to initialize the
 * client at all, and with the required project DSN.
 */
export interface SentryConfig extends NodeOptions {
	/**
	 * Enable or disable Sentry
	 */
	enabled: boolean;

	/**
	 * The DSN of the project
	 */
	dsn: string;
}

const sentryConfig = {
	/**
	 * Enable or disable Sentry
	 */
	enabled: app.inProduction,

	/**
	 * The environment Sentry is running in
	 */
	environment: app.nodeEnvironment,

	/**
	 * The DSN of the project
	 */
	dsn: env.get('SENTRY_DSN'),

	/**
	 * Additional integrations to use with the Sentry SDK
	 * @see https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/#available-integrations
	 */
	integrations: [],

	/**
	 * The sample rate of traces to send to Sentry
	 * @see https://docs.sentry.io/platforms/javascript/guides/node/configuration/sampling
	 */
	tracesSampleRate: 0.1,
} satisfies SentryConfig;

export default sentryConfig;
