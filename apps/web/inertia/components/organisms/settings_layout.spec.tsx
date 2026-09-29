import { TuyauProvider } from '@adonisjs/inertia/react';
import { http, router, type HttpRequestConfig, type Page } from '@inertiajs/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost/settings/account" }
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { client } from '~/client';
import { SettingsLayout } from '~/components/organisms/settings_layout';
import type { TranslationNodes } from '#transport/core/helpers/translation_tree';

/**
 * Regression guard for the Settings "Logout" tab.
 *
 * The logout endpoint (`auth.session.destroy`, `POST /logout`) only accepts a
 * state-changing POST. The tab used to render as a plain Inertia `<Link>`
 * (GET navigation), so clicking it issued `GET /logout` — which matches no
 * route — and the session was never destroyed. The control must therefore
 * submit a **POST** visit to `/logout`.
 *
 * The real `SettingsLayout`, the real design-system `NavLink`, and the real
 * core router run end to end. Only two seams are substituted: Inertia's
 * server-provided `usePage` context (guest: no `currentUser`) and the HTTP
 * client (the real visit path executes; the request is recorded and answered
 * with a minimal Inertia page payload instead of going to the network).
 */

const { mockPageProps } = vi.hoisted(() => ({
	mockPageProps: {
		url: 'http://localhost/settings/account',
		props: {
			currentUser: undefined,
		},
	},
}));

vi.mock('@inertiajs/react', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@inertiajs/react')>();
	return {
		...actual,
		usePage: () => mockPageProps,
		Head: () => null,
	};
});

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const PAGE: Page = {
	url: 'http://localhost/settings/account',
	component: 'SettingsLayout',
	props: { errors: {} },
	version: null,
	rescuedProps: [],
	flash: { error: undefined, success: undefined, info: undefined },
	rememberedState: {},
};

const recorded: { url: string; method: string; data: any }[] = [];

beforeAll(() => {
	router.init({
		initialPage: { ...PAGE },
		resolveComponent: async () => null,
		swapComponent: () => Promise.resolve(),
		onFlash: () => {},
	});
	http.setClient({
		request: async (config: HttpRequestConfig) => {
			recorded.push({ url: config.url, method: config.method, data: config.data });
			return {
				status: 200,
				data: JSON.stringify(PAGE),
				headers: { 'x-inertia': 'true' },
			};
		},
	});
});

const translations: TranslationNodes = {
	header: {
		title: 'Settings',
		sub_title: 'Manage your account.',
		tabs: {
			profile: 'Profile',
			account: 'Account',
			preferences: 'Preferences',
			admin: 'Admin',
			logout: 'Logout',
		},
	},
};

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
	recorded.length = 0;
	container = document.createElement('div');
	document.body.appendChild(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
});

function clickLogout() {
	// The logout control is the tab whose visible label is "Logout". Depending
	// on whether it renders as an anchor (GET) or a form submit (POST) it is an
	// <a> or a <button>, so match by text rather than by tag.
	const logout = Array.from(container.querySelectorAll<HTMLElement>('a, button')).find(
		(el) => el.textContent?.trim() === 'Logout',
	);

	expect(logout).not.toBeUndefined();
	act(() => {
		logout!.click();
	});
}

describe('SettingsLayout — logout tab', () => {
	it('submits a POST visit to /logout so the session is destroyed', async () => {
		await act(async () => {
			root.render(
				<TuyauProvider client={client}>
					<SettingsLayout tab="account" translations={translations}>
						<div>content</div>
					</SettingsLayout>
				</TuyauProvider>,
			);
		});

		clickLogout();

		// Let the (recorded) visit run its async response handling.
		await act(async () => {});

		expect(recorded).toHaveLength(1);
		// Inertia resolves the relative href against the page origin, so check
		// the path rather than the full URL.
		expect(new URL(recorded[0].url).pathname).toBe('/logout');
		// The core assertion: logout is a state-changing POST, not a GET.
		expect(recorded[0].method).toBe('post');
	});
});
