// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { initSentry } from '~/lib/sentry';
import { ErrorBoundary } from './error_boundary';
import type { BrowserOptions, Event } from '@sentry/react';

/**
 * Smoke test for the frontend Sentry wiring: a component that throws during
 * render must produce an event that travels the real SDK pipeline (boundary
 * capture → event scrubbing → transport) into a fake transport, with no
 * network and no PII.
 */

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// Derived from the SDK's own option types so the fake transport matches the
// exact envelope shapes of the installed @sentry version.
type Transport = ReturnType<NonNullable<BrowserOptions['transport']>>;
type Envelope = Parameters<Transport['send']>[0];

const sent: Envelope[] = [];

const fakeTransport: Transport = {
	send: (request) => {
		sent.push(request);
		return Promise.resolve({});
	},
	flush: () => Promise.resolve(true),
};

beforeAll(() => {
	initSentry({
		dsn: 'https://public@o1.ingest.sentry.io/1',
		release: 'test-release',
		environment: 'test',
		transport: () => fakeTransport,
	});
});

function eventItems(): Event[] {
	return sent.flatMap((envelope) => {
		// The envelope's items union outlives the event item we care about;
		// collapse it to a structural pair.
		const items = envelope[1] as Array<[Record<string, unknown>, unknown]>;
		return items.filter((item) => item[0].type === 'event').map((item) => item[1] as Event);
	});
}

function Exploding(): never {
	throw new Error('kaboom');
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	sent.length = 0;
	container = document.createElement('div');
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

describe('ErrorBoundary + Sentry smoke', () => {
	it('renders its children while no error is latched', () => {
		act(() => {
			root.render(
				<ErrorBoundary>
					<div>all good</div>
				</ErrorBoundary>,
			);
		});

		expect(container.textContent).toContain('all good');
		expect(eventItems()).toHaveLength(0);
	});

	it('reports a thrown render error to the transport and renders the fallback', async () => {
		act(() => {
			root.render(
				<ErrorBoundary fallback={() => <div>fallback-ui</div>}>
					<Exploding />
				</ErrorBoundary>,
			);
		});

		// Let the capture pipeline flush its async send.
		await act(async () => {});

		expect(container.textContent).toContain('fallback-ui');

		const events = eventItems();
		expect(events).toHaveLength(1);
		expect(events[0].exception?.values?.[0]?.value).toBe('kaboom');
		expect(events[0].exception?.values?.[0]?.type).toBe('Error');
		expect(events[0].tags).toMatchObject({ source: 'react_error_boundary' });
		expect(String(events[0].extra?.componentStack)).toContain('Exploding');

		// The event travels with the build metadata…
		expect(events[0].environment).toBe('test');
		expect(events[0].release).toBe('test-release');

		// …and the scrubber keeps it PII-free.
		expect(events[0].user).toBeUndefined();
	});
});
