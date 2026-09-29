import * as Sentry from '@sentry/react';
import type { BrowserOptions, Event } from '@sentry/react';

/**
 * Configuration for the browser-side Sentry client.
 */
export interface SentryWebConfig {
	/**
	 * The DSN of the project. An empty value disables the client.
	 */
	dsn: string;
	/**
	 * The release tag for events, derived from the build.
	 */
	release?: string;
	/**
	 * The environment the bundle runs in (e.g. `development`, `production`).
	 */
	environment: string;
}

/**
 * The value PII fields are replaced with when scrubbed.
 */
export const REDACTED = '[REDACTED]';

/**
 * Key names whose values are considered personal data and must never be
 * reported. Matching is unanchored so suffixed variants (`user_email`,
 * `api_key_hash`) are caught as well.
 */
const PII_KEY_PATTERN =
	/e-?mail|user_?name|passw|secret|token|auth|api[-_]?key|phone|mobile|address|credit[-_]?card|\bip\b/i;

/**
 * Recursively redacts PII-looking keys in a plain record, descending into
 * nested objects and arrays.
 *
 * @param record - The record to scrub in place.
 * @returns The same record, mutated.
 */
function scrubRecord(record: Record<string, unknown>): Record<string, unknown> {
	for (const [key, value] of Object.entries(record)) {
		if (PII_KEY_PATTERN.test(key)) {
			record[key] = REDACTED;
		} else if (Array.isArray(value)) {
			for (const entry of value) {
				if (entry && typeof entry === 'object') {
					scrubRecord(entry as Record<string, unknown>);
				}
			}
		} else if (value && typeof value === 'object') {
			scrubRecord(value as Record<string, unknown>);
		}
	}
	return record;
}

/**
 * Scrubs an event so the payload is PII-free before it leaves the browser.
 *
 * The user identity attached to the event is dropped outright (the client is
 * initialized with `sendDefaultPii: false` and no user is set), and the
 * well-known PII keys inside `extra`, `contexts`, breadcrumb `data` and the
 * request headers are replaced with `REDACTED`.
 *
 * @param event - The event about to be sent, mutated and returned.
 * @returns The scrubbed event.
 */
export function scrubEvent<T extends Event>(event: T): T {
	delete event.user;

	if (event.extra) {
		scrubRecord(event.extra as Record<string, unknown>);
	}
	if (event.contexts) {
		scrubRecord(event.contexts as unknown as Record<string, unknown>);
	}
	if (event.breadcrumbs) {
		event.breadcrumbs = event.breadcrumbs.map((crumb) =>
			crumb.data ? { ...crumb, data: scrubRecord(crumb.data as Record<string, unknown>) } : crumb,
		);
	}
	if (event.request) {
		delete event.request.cookies;
		if (event.request.headers) {
			scrubRecord(event.request.headers as Record<string, unknown>);
		}
	}

	return event;
}

/**
 * Builds the browser `@sentry/react` options for the given configuration.
 *
 * PII is kept out by default: `sendDefaultPii` is off, tracing is disabled,
 * and every event passes through {@link scrubEvent}.
 *
 * @param config - The DSN, release and environment for the client.
 * @returns The options to hand to `Sentry.init`.
 */
export function buildSentryOptions(config: SentryWebConfig): BrowserOptions {
	return {
		dsn: config.dsn,
		release: config.release,
		environment: config.environment,
		sendDefaultPii: false,
		tracesSampleRate: 0,
		beforeSend: (event) => scrubEvent(event),
	};
}

/**
 * Resolves the web Sentry configuration from the build-time environment:
 * the DSN and release are inlined by the bundler (see `vite.config.ts`),
 * the environment is the Vite build mode.
 *
 * @returns The resolved configuration. An empty `dsn` means "disabled".
 */
export function resolveWebSentryConfig(): SentryWebConfig {
	return {
		dsn: import.meta.env.SENTRY_DSN ?? '',
		release: import.meta.env.APP_RELEASE ?? '',
		environment: import.meta.env.MODE,
	};
}

/**
 * Initializes the browser Sentry client from the build-time environment.
 *
 * The initialization is a no-op when no DSN was inlined, so deployments that
 * leave the variable unset report nothing. Extra options are merged over the
 * built-in ones and let callers (e.g. tests) inject a fake transport.
 *
 * @param overrides - Options merged over the defaults (DSN, release, environment, transport, …).
 *
 * @example
 * initSentry();
 */
export function initSentry(overrides: Partial<BrowserOptions> = {}): void {
	const resolved = resolveWebSentryConfig();
	const { dsn, release, environment, ...rest } = { ...resolved, ...overrides };

	if (!dsn) {
		return;
	}

	Sentry.init({ ...buildSentryOptions({ dsn, release, environment }), ...rest });
}
