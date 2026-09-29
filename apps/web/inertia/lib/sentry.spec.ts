import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { REDACTED, buildSentryOptions, initSentry, scrubEvent } from './sentry';
import type { Event } from '@sentry/react';

/**
 * The browser Sentry seam: options are PII-off by default, events are scrubbed
 * of personal data, and the client stays a no-op when no DSN was inlined into
 * the build.
 */

const { init } = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock('@sentry/react', () => ({ init }));

const options = buildSentryOptions({
	dsn: 'https://public@o1.ingest.sentry.io/1',
	release: 'foundry-1.0.0',
	environment: 'production',
});

const beforeSend = options.beforeSend as (event: Event) => Event;

describe('scrubEvent', () => {
	it('drops the user attached to the event', () => {
		const event: Event = { user: { email: 'kernel@example.com', username: 'kernel' } };

		scrubEvent(event);

		expect(event.user).toBeUndefined();
	});

	it('redacts PII keys in extra, nested objects and arrays', () => {
		const event: Event = {
			extra: {
				email: 'kernel@example.com',
				nested: { user_name: 'kernel', token: 'abc123' },
				list: [{ password: 'hunter2' }],
			},
		};

		scrubEvent(event);

		expect(event.extra).toEqual({
			email: REDACTED,
			nested: { user_name: REDACTED, token: REDACTED },
			list: [{ password: REDACTED }],
		});
	});

	it('keeps non-PII values intact', () => {
		const event: Event = { extra: { page: '/home', count: 3 } };

		scrubEvent(event);

		expect(event.extra).toEqual({ page: '/home', count: 3 });
	});

	it('redacts PII in contexts and breadcrumb data', () => {
		const event: Event = {
			contexts: { user: { email: 'kernel@example.com', username: 'kernel', ip_address: '10.0.0.1' } },
			breadcrumbs: [{ type: 'http', data: { email: 'kernel@example.com', status: 200 } }],
		};

		scrubEvent(event);

		expect(event.contexts?.user).toEqual({ email: REDACTED, username: REDACTED, ip_address: REDACTED });
		expect(event.breadcrumbs?.[0].data).toEqual({ email: REDACTED, status: 200 });
	});

	it('removes request cookies and redacts PII request headers', () => {
		const event: Event = {
			request: {
				url: 'https://example.com/page',
				cookies: { session: 's3cr3t' },
				headers: { authorization: 'Bearer abc', accept: 'application/json' },
			},
		};

		scrubEvent(event);

		expect(event.request?.cookies).toBeUndefined();
		expect(event.request?.headers).toEqual({ authorization: REDACTED, accept: 'application/json' });
	});
});

describe('buildSentryOptions', () => {
	it('carries the dsn, release and environment with PII off and no tracing', () => {
		expect(options.dsn).toBe('https://public@o1.ingest.sentry.io/1');
		expect(options.release).toBe('foundry-1.0.0');
		expect(options.environment).toBe('production');
		expect(options.sendDefaultPii).toBe(false);
		expect(options.tracesSampleRate).toBe(0);
	});

	it('runs every event through the scrubber via beforeSend', () => {
		const scrubbed = beforeSend({ user: { email: 'kernel@example.com' }, extra: { email: 'kernel@example.com' } });

		expect(scrubbed.user).toBeUndefined();
		expect(scrubbed.extra).toEqual({ email: REDACTED });
	});
});

describe('initSentry', () => {
	const env = import.meta.env as Record<string, unknown>;

	beforeEach(() => {
		init.mockClear();
		delete env.SENTRY_DSN;
		delete env.APP_RELEASE;
	});

	afterEach(() => {
		delete env.SENTRY_DSN;
		delete env.APP_RELEASE;
	});

	it('is a no-op when no DSN was inlined into the build', () => {
		initSentry();

		expect(init).not.toHaveBeenCalled();
	});

	it('initializes the client with the resolved build config', () => {
		env.SENTRY_DSN = 'https://public@o1.ingest.sentry.io/1';
		env.APP_RELEASE = 'foundry-1.0.0';

		initSentry();

		expect(init).toHaveBeenCalledTimes(1);
		expect(init.mock.calls[0]?.[0]).toMatchObject({
			dsn: 'https://public@o1.ingest.sentry.io/1',
			release: 'foundry-1.0.0',
			sendDefaultPii: false,
		});
	});

	it('merges caller overrides over the resolved config', () => {
		env.SENTRY_DSN = 'https://public@o1.ingest.sentry.io/1';

		initSentry({ dsn: 'https://other@o1.ingest.sentry.io/2', environment: 'test' });

		expect(init.mock.calls[0]?.[0]).toMatchObject({
			dsn: 'https://other@o1.ingest.sentry.io/2',
			environment: 'test',
		});
	});
});
