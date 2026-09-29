import { test } from '@japa/runner';
import ApiClientUrlMissingException from '#auth/exceptions/api_client_url_missing_exception';
import { completeSocialApiCallback } from '#transport/auth/helpers/social_api_callback';

/**
 * Unit tests for the shared OAuth API-mode callback (spec #6 social API mode).
 *
 * The ally provider and the token-issuing action are mocked; the helper's
 * job is the redirect-to-client-URL contract, so that is what is asserted.
 */

/** Build a minimal mock HTTP context with a controllable redirect target. */
function createMockCtx(provider: Record<string, any> = {}) {
	let redirectPath = '';

	const ctx = {
		ally: {
			use: () => ({
				accessDenied: () => false,
				stateMisMatch: () => false,
				hasError: () => false,
				user: async () => ({ id: 'gh_1', email: 'u@example.com' }),
				...provider,
			}),
		},
		response: {
			redirect: () => ({
				toPath: (path: string) => {
					redirectPath = path;
				},
			}),
		},
	};

	return { ctx, getRedirectPath: () => redirectPath };
}

test.group('completeSocialApiCallback', () => {
	test('redirects to AUTH_API_CLIENT_URL with the issued token', async ({ assert }) => {
		const original = process.env.AUTH_API_CLIENT_URL;
		process.env.AUTH_API_CLIENT_URL = 'https://client.example.com/callback';

		try {
			const { ctx, getRedirectPath } = createMockCtx();
			const fakeAction = {
				execute: async () => ({
					token: 'oat_abc.def',
					expiresAt: new Date('2026-01-01T00:00:00.000Z'),
					user: { id: 1 },
				}),
			};

			await completeSocialApiCallback(ctx as any, 'github' as any, fakeAction as any);

			const url = new URL(getRedirectPath());
			assert.equal(url.origin, 'https://client.example.com');
			assert.equal(url.searchParams.get('token'), 'oat_abc.def');
			assert.equal(url.searchParams.get('expires_at'), '2026-01-01T00:00:00.000Z');
		} finally {
			if (original !== undefined) process.env.AUTH_API_CLIENT_URL = original;
			else delete process.env.AUTH_API_CLIENT_URL;
		}
	});

	test('redirects with an error param when the provider denies access', async ({ assert }) => {
		const original = process.env.AUTH_API_CLIENT_URL;
		process.env.AUTH_API_CLIENT_URL = 'https://client.example.com/callback';

		try {
			const { ctx, getRedirectPath } = createMockCtx({ accessDenied: () => true });

			await completeSocialApiCallback(ctx as any, 'github' as any, {} as any);

			const url = new URL(getRedirectPath());
			assert.equal(url.searchParams.get('error'), 'access_denied');
		} finally {
			if (original !== undefined) process.env.AUTH_API_CLIENT_URL = original;
			else delete process.env.AUTH_API_CLIENT_URL;
		}
	});

	test('throws ApiClientUrlMissingException when AUTH_API_CLIENT_URL is unset', async ({ assert }) => {
		const original = process.env.AUTH_API_CLIENT_URL;
		delete process.env.AUTH_API_CLIENT_URL;

		try {
			const { ctx } = createMockCtx();

			await assert.rejects(async () => {
				await completeSocialApiCallback(ctx as any, 'github' as any, {} as any);
			}, ApiClientUrlMissingException);
		} finally {
			if (original !== undefined) process.env.AUTH_API_CLIENT_URL = original;
		}
	});
});
