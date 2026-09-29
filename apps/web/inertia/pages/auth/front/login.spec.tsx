import { TuyauProvider } from '@adonisjs/inertia/react';
import { http, router, type HttpRequestConfig, type Page } from '@inertiajs/core';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost/auth/login" }
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { client } from '~/client';
import LoginPage from '~/pages/auth/front/login';
import type { OAuthProvider } from '#auth/types/auth';
import type { LoginTranslations } from '#transport/auth/helpers/i18n_payloads/session';

/**
 * Login form submission contract: filling both fields and submitting must
 * issue an Inertia visit that carries the typed values in its `data` payload
 * with the route's own HTTP method, and must not raise a client-side
 * "required" error.
 *
 * Regression guard for the `route=` to `action={urlFor()}` migration: a
 * string `action` without an explicit method makes the Inertia `Form`
 * resolve the visit as a GET, which moves the field values into the query
 * string and hands `onBefore` an empty `data` record, so every field fails
 * its required check even though the inputs are filled.
 *
 * The real page, real `Form`, and real core router run end to end. Only two
 * seams are substituted: Inertia's server-provided `usePage` context, and
 * the HTTP client (the real visit path, including `onBefore`, executes; the
 * request is recorded and answered with a minimal Inertia page payload
 * instead of going to the network).
 */

const { mockPageProps } = vi.hoisted(() => ({
	mockPageProps: {
		props: {
			common_translations: {
				validation: {
					fields: { email: 'Email', password: 'Password' },
					required: 'The {field} field is required.',
					min_length: 'The {field} must be at least {min} characters.',
				},
			},
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
	url: 'http://localhost/auth/login',
	component: 'LoginPage',
	props: { errors: {} },
	version: null,
	rescuedProps: [],
	flash: { error: undefined, success: undefined, info: undefined },
	rememberedState: {},
};

const recorded: { url: string; method: string; data: any; params: any }[] = [];

beforeAll(() => {
	// Bring the real core router to life in jsdom: seed the page singleton
	// and swap the XHR client for a recorder that answers with an Inertia
	// page payload, so a successful visit completes without a network.
	router.init({
		initialPage: { ...PAGE },
		resolveComponent: async () => null,
		swapComponent: () => Promise.resolve(),
		onFlash: () => {},
	});
	http.setClient({
		request: async (config: HttpRequestConfig) => {
			recorded.push({ url: config.url, method: config.method, data: config.data, params: config.params });
			return {
				status: 200,
				data: JSON.stringify(PAGE),
				headers: { 'x-inertia': 'true' },
			};
		},
	});
});

const translations: LoginTranslations = {
	title: 'Log in',
	sub_title: 'Welcome back.',
	account: { no: "Don't have an account?", create: 'Create one' },
	email: { value: 'Email', placeholder: 'you@example.com' },
	password: { value: 'Password', forgot: 'Forgot your password?' },
	remember_me: 'Remember me',
	submit: 'Log in',
	or_continue_with: 'Or continue with',
};

const providers: OAuthProvider[] = [];

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

function fillAndSubmit() {
	const email = container.querySelector<HTMLInputElement>('input[name="email"]');
	const password = container.querySelector<HTMLInputElement>('input[name="password"]');
	const submit = container.querySelector<HTMLButtonElement>('button[type="submit"]');

	expect(email).not.toBeNull();
	expect(password).not.toBeNull();
	expect(submit).not.toBeNull();

	act(() => {
		email!.value = 'kernel@test.com';
		email!.dispatchEvent(new Event('input', { bubbles: true }));
	});
	act(() => {
		password!.value = 'secret-password';
		password!.dispatchEvent(new Event('input', { bubbles: true }));
	});
	act(() => {
		submit!.click();
	});
}

describe('LoginPage — form submission', () => {
	it('submits the filled values in the visit data with the route method', async () => {
		await act(async () => {
			root.render(
				<TuyauProvider client={client}>
					<LoginPage providers={providers} translations={translations} />
				</TuyauProvider>,
			);
		});

		fillAndSubmit();

		// Let the (recorded) visit run its async response handling.
		await act(async () => {});

		// The user filled both fields…
		expect(container.querySelector<HTMLInputElement>('input[name="email"]')!.value).toBe('kernel@test.com');
		expect(container.querySelector<HTMLInputElement>('input[name="password"]')!.value).toBe('secret-password');

		// …so submitting must not report them as required.
		expect(container.textContent).not.toContain('field is required');

		// And the visit must carry the typed values in its data payload,
		// submitted with the route's own method (not a defaulted GET).
		expect(recorded).toHaveLength(1);
		expect(recorded[0].method).toBe('post');
		expect(recorded[0].data).toEqual({ email: 'kernel@test.com', password: 'secret-password' });
	});
});
