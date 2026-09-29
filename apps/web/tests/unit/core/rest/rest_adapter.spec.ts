import { type HttpContext } from '@adonisjs/core/http';
import { test } from '@japa/runner';
import { handle, type AnyRestEndpoint } from '#transport/core/rest/rest_adapter';

interface RecordedCall {
	method: string;
	args: unknown[];
}

/**
 * Builds a minimal `HttpContext` double: fake request body, route params,
 * pass-through `serialize`, and a response that records its calls.
 */
function createFakeContext(body: Record<string, unknown> = {}, params: Record<string, string> = {}) {
	const calls: RecordedCall[] = [];

	const ctx = {
		request: {
			all: () => ({ ...body }),
			only: (keys: string[]) => Object.fromEntries(Object.entries(body).filter(([key]) => keys.includes(key))),
		},
		params: { ...params },
		serialize: (data: unknown) => Promise.resolve({ data }),
		response: {
			status(code: number) {
				calls.push({ method: 'status', args: [code] });
				return {
					send(payload: unknown) {
						calls.push({ method: 'send', args: [payload] });
					},
				};
			},
			noContent() {
				calls.push({ method: 'noContent', args: [] });
			},
		},
	};

	return { ctx: ctx as unknown as HttpContext, calls };
}

test.group('handle', () => {
	test('validates the default request payload and sends the transformed result at 200', async ({ assert }) => {
		const { ctx, calls } = createFakeContext({ email: 'jane@example.com' });
		let executed: unknown;

		const endpoint: AnyRestEndpoint = {
			validator: () => ({ validate: async (data) => data }),
			execute: async (_context, _prepared, payload) => {
				executed = payload;
				return { id: 1 };
			},
			transform: (entity) => ({ transformed: entity }),
		};

		await handle(ctx, endpoint);

		assert.deepEqual(executed, { email: 'jane@example.com' });
		assert.deepEqual(calls, [
			{ method: 'status', args: [200] },
			{ method: 'send', args: [{ data: { transformed: { id: 1 } } }] },
		]);
	});

	test('strips empty strings from the input when `strip` is declared', async ({ assert }) => {
		const { ctx } = createFakeContext({ email: '', note: 'a' });
		let executed: unknown;

		const endpoint: AnyRestEndpoint = {
			strip: true,
			validator: () => ({ validate: async (data) => data }),
			execute: async (_context, _prepared, payload) => {
				executed = payload;
				return 'ok';
			},
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.deepEqual(executed, { note: 'a' });
	});

	test('uses the `input` override instead of `request.all()`', async ({ assert }) => {
		const { ctx } = createFakeContext({}, { id: '42' });
		let executed: unknown;

		const endpoint: AnyRestEndpoint = {
			input: (context) => context.params,
			validator: () => ({ validate: async (data) => data }),
			execute: async (_context, _prepared, payload) => {
				executed = payload;
				return 'ok';
			},
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.deepEqual(executed, { id: '42' });
	});

	test('passes the validated pagination to the context', async ({ assert }) => {
		const { ctx } = createFakeContext({ page: '2' });
		let seenPagination: { page?: number; perPage?: number } | undefined;

		const endpoint: AnyRestEndpoint = {
			paginated: true,
			validator: () => ({ validate: async (data) => data }),
			execute: async (context) => {
				seenPagination = context.pagination;
				return 'ok';
			},
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.equal(seenPagination?.page, 2);
		assert.isNumber(seenPagination?.perPage);
	});

	test('passes the prepared value to the validator factory', async ({ assert }) => {
		const { ctx } = createFakeContext({ role_id: '1' });
		let executed: unknown;

		const endpoint: AnyRestEndpoint = {
			prepare: async () => ({ allowed: ['1'] }),
			validator: (prepared) => ({
				validate: async (data) => ({
					...(data as Record<string, unknown>),
					allowed: prepared.allowed,
				}),
			}),
			execute: async (_context, _prepared, payload) => {
				executed = payload;
				return 'ok';
			},
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.deepEqual(executed, { role_id: '1', allowed: ['1'] });
	});

	test('refetches the persisted state when a `refetch` is declared', async ({ assert }) => {
		const { ctx, calls } = createFakeContext({ email: 'jane@example.com' });

		const endpoint: AnyRestEndpoint = {
			validator: () => ({ validate: async (data) => data }),
			execute: async () => ({ fresh: true }),
			refetch: async (_context, _prepared, _payload, result) => ({
				refetched: result.fresh,
			}),
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.deepEqual(calls, [
			{ method: 'status', args: [200] },
			{ method: 'send', args: [{ data: { refetched: true } }] },
		]);
	});

	test('sends 201 when the status is declared', async ({ assert }) => {
		const { ctx, calls } = createFakeContext({ email: 'jane@example.com' });

		const endpoint: AnyRestEndpoint = {
			status: 201,
			validator: () => ({ validate: async (data) => data }),
			execute: async () => ({ id: 1 }),
			transform: (entity) => entity,
		};

		await handle(ctx, endpoint);

		assert.deepEqual(calls, [
			{ method: 'status', args: [201] },
			{ method: 'send', args: [{ data: { id: 1 } }] },
		]);
	});

	test('sends 204 without a body and never calls the transformer', async ({ assert }) => {
		const { ctx, calls } = createFakeContext({ id: '42' });
		let transformed = false;

		const endpoint: AnyRestEndpoint = {
			status: 204,
			validator: () => ({ validate: async (data) => data }),
			execute: async () => true,
			transform: () => {
				transformed = true;
			},
		};

		await handle(ctx, endpoint);

		assert.isFalse(transformed);
		assert.deepEqual(calls, [{ method: 'noContent', args: [] }]);
	});

	test('propagates domain exceptions thrown by the action', async ({ assert }) => {
		const { ctx } = createFakeContext({ id: '42' });

		const endpoint: AnyRestEndpoint = {
			validator: () => ({ validate: async (data) => data }),
			execute: async () => {
				throw new Error('boom');
			},
		};

		await assert.rejects(() => handle(ctx, endpoint), /boom/);
	});
});
