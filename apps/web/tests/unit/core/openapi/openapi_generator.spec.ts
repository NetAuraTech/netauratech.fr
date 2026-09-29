import { test } from '@japa/runner';
import vine from '@vinejs/vine';
import { buildOpenApiSpec, type ApiRouteSummary } from '#transport/core/openapi/openapi_generator';
import type { ApiOperationDoc } from '#transport/core/openapi/api_docs_registry';
import type { OpenApiParameter, OpenApiSpec } from '#transport/core/openapi/openapi_generator';

const securitySchemes = {
	apiToken: { type: 'http', scheme: 'bearer' },
	session: { type: 'apiKey', in: 'cookie', name: 'adonis-session' },
} as const;

const info = { title: 'Test API', version: '1.0.0' };

/** Builds a spec from the given routes and docs for assertion convenience. */
function build(routes: ApiRouteSummary[], docs: Map<string, ApiOperationDoc> = new Map()): OpenApiSpec {
	return buildOpenApiSpec({ routes, docs, info, securitySchemes });
}

test.group('OpenAPI generator', () => {
	test('produces an OpenAPI 3.0 document skeleton', ({ assert }) => {
		const spec = build([]);

		assert.equal(spec.openapi, '3.0.3');
		assert.equal(spec.info.title, 'Test API');
		assert.equal(spec.info.version, '1.0.0');
		assert.deepEqual(spec.servers, [{ url: '/' }]);
		assert.deepEqual(spec.paths, {});
		assert.deepEqual(spec.components.securitySchemes, securitySchemes);
	});

	test('maps a named API route to its path, method, and operation id', ({ assert }) => {
		const spec = build([{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' }]);

		const operation = spec.paths['/api/v1/admin/users'].get;
		assert.exists(operation);
		assert.equal(operation.operationId, 'api.v1.admin.identity.users.index');
	});

	test('converts route params to OpenAPI path parameters', ({ assert }) => {
		const spec = build([
			{ name: 'api.v1.admin.identity.users.show', pattern: '/api/v1/admin/users/:id', method: 'GET' },
		]);

		const operation = spec.paths['/api/v1/admin/users/{id}'].get;
		assert.exists(operation);
		assert.deepEqual(operation.parameters, [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }]);
	});

	test('derives the path parameter schema from a path-carried validator', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.show',
				{ summary: 'Show a user', request: [{ validator: vine.create({ id: vine.number().positive() }), in: 'path' }] },
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.show', pattern: '/api/v1/admin/users/:id', method: 'GET' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users/{id}'].get;
		assert.equal(operation.parameters![0].schema.type, 'number');
	});

	test('skips routes outside /api/v1 and non-JSON methods', ({ assert }) => {
		const spec = build([
			{ name: 'core.home', pattern: '/', method: 'GET' },
			{ name: 'api.v1.health', pattern: '/api/v1/health', method: 'HEAD' },
		]);

		assert.deepEqual(spec.paths, {});
	});

	test('turns a query-carried validator into query parameters', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.index',
				{
					summary: 'List users',
					request: [
						{
							validator: vine.create({
								search: vine.string().trim().maxLength(100).optional(),
								role: vine.string().in(['admin', 'editor']).optional(),
							}),
							in: 'query',
						},
					],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users'].get;
		const byName = new Map<string, OpenApiParameter>(
			operation.parameters!.map((p): [string, OpenApiParameter] => [p.name, p]),
		);

		assert.equal(byName.get('search')!.required, false);
		assert.equal(byName.get('search')!.in, 'query');
		assert.equal(byName.get('role')!.schema.type, 'string');
	});

	test('strips the empty required array Vine emits for fully-optional validators', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.store',
				{
					summary: 'Create a user',
					request: [{ validator: vine.create({ nickname: vine.string().optional() }), in: 'body' }],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.store', pattern: '/api/v1/admin/users', method: 'POST' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users'].post;
		assert.isUndefined(operation.requestBody!.content['application/json'].schema.required);
	});

	test('rewrites Vine nullable fields to the OpenAPI nullable flag', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.update',
				{
					summary: 'Update a user',
					request: [
						{
							validator: vine.create({
								email: vine.string().email(),
								api_rate_limit: vine.number().positive().withoutDecimals().optional().nullable(),
							}),
							in: 'body',
						},
					],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.update', pattern: '/api/v1/admin/users/:id', method: 'PUT' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users/{id}'].put;
		const bodyProperties = operation.requestBody!.content['application/json'].schema.properties as Record<
			string,
			Record<string, unknown>
		>;
		assert.equal(bodyProperties.api_rate_limit.type, 'integer');
		assert.isTrue(bodyProperties.api_rate_limit.nullable);
	});

	test('adds the shared pagination query parameters when the endpoint paginates', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			['api.v1.admin.identity.users.index', { summary: 'List users', paginated: true }],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users'].get;
		const byName = new Map<string, OpenApiParameter>(
			operation.parameters!.map((p): [string, OpenApiParameter] => [p.name, p]),
		);

		assert.exists(byName.get('page'));
		assert.exists(byName.get('perPage'));
		assert.equal(byName.get('page')!.in, 'query');
	});

	test('builds the request body from a body-carried validator', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.store',
				{
					summary: 'Create a user',
					request: [
						{
							validator: vine.create({ email: vine.string().email(), nickname: vine.string().optional() }),
							in: 'body',
						},
					],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.store', pattern: '/api/v1/admin/users', method: 'POST' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users'].post;
		assert.equal(operation.requestBody!.required, true);
		const bodyProperties = operation.requestBody!.content['application/json'].schema.properties as Record<
			string,
			unknown
		>;
		assert.exists(bodyProperties.email);
		assert.exists(bodyProperties.nickname);
	});

	test('marks the request body optional when the validator has no required field', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.store',
				{
					summary: 'Create a user',
					request: [{ validator: vine.create({ email: vine.string().email().optional() }), in: 'body' }],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.store', pattern: '/api/v1/admin/users', method: 'POST' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users'].post;
		assert.equal(operation.requestBody!.required, false);
	});

	test('emits declared responses and falls back to a bare 200', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.store',
				{
					summary: 'Create a user',
					responses: {
						'201': {
							description: 'The created user',
							schema: { type: 'object', properties: { id: { type: 'number' } } },
						},
						'422': { description: 'Validation failed' },
					},
				},
			],
		]);

		const spec = build(
			[
				{ name: 'api.v1.admin.identity.users.store', pattern: '/api/v1/admin/users', method: 'POST' },
				{ name: 'api.v1.other', pattern: '/api/v1/other', method: 'GET' },
			],
			docs,
		);

		const store = spec.paths['/api/v1/admin/users'].post;
		assert.exists(store.responses['201'].content!['application/json'].schema);
		assert.equal(store.responses['422'].description, 'Validation failed');
		assert.isUndefined(store.responses['422'].content);

		assert.deepEqual(spec.paths['/api/v1/other'].get.responses, { '200': { description: 'Successful response.' } });
	});

	test('applies the default security requirements to admin routes only', ({ assert }) => {
		const spec = build([
			{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' },
			{ name: 'api.v1.auth.login.execute', pattern: '/api/v1/auth/login', method: 'POST' },
		]);

		assert.deepEqual(spec.paths['/api/v1/admin/users'].get.security, [{ apiToken: [] }, { session: [] }]);
		assert.isUndefined(spec.paths['/api/v1/auth/login'].post.security);
	});

	test('lets a doc override the default security requirements', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			['api.v1.admin.identity.users.index', { summary: 'List users', security: [['apiToken']] }],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' }],
			docs,
		);

		assert.deepEqual(spec.paths['/api/v1/admin/users'].get.security, [{ apiToken: [] }]);
	});

	test('collects the doc tags into the top-level tag list', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			['api.v1.admin.identity.users.index', { summary: 'List users', tags: ['Users'] }],
			['api.v1.admin.identity.roles.index', { summary: 'List roles', tags: ['Roles'] }],
		]);

		const spec = build(
			[
				{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' },
				{ name: 'api.v1.admin.identity.roles.index', pattern: '/api/v1/admin/roles', method: 'GET' },
			],
			docs,
		);

		assert.deepEqual(spec.tags, [{ name: 'Roles' }, { name: 'Users' }]);
	});

	test('leaves operations without docs at a minimal shape', ({ assert }) => {
		const spec = build([{ name: 'api.v1.auth.login.execute', pattern: '/api/v1/auth/login', method: 'POST' }]);

		const operation = spec.paths['/api/v1/auth/login'].post;
		assert.exists(operation.operationId);
		assert.isUndefined(operation.summary);
		assert.isUndefined(operation.parameters);
		assert.isUndefined(operation.requestBody);
	});

	test('derives path and body parameters from a multi-location request', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			[
				'api.v1.admin.identity.users.update',
				{
					summary: 'Update a user',
					request: [
						{ validator: vine.create({ id: vine.number().positive() }), in: 'path' },
						{ validator: vine.create({ email: vine.string().email() }), in: 'body' },
					],
				},
			],
		]);

		const spec = build(
			[{ name: 'api.v1.admin.identity.users.update', pattern: '/api/v1/admin/users/:id', method: 'PUT' }],
			docs,
		);

		const operation = spec.paths['/api/v1/admin/users/{id}'].put;
		const pathParam = operation.parameters!.find((p) => p.in === 'path');
		assert.equal(pathParam!.name, 'id');
		assert.equal(pathParam!.schema.type, 'number');
		assert.exists(operation.requestBody);
	});

	test('derives the pagination parameter schemas from the shared pagination validator', ({ assert }) => {
		const docs = new Map<string, ApiOperationDoc>([
			['api.v1.admin.identity.users.index', { summary: 'List users', paginated: true }],
		]);
		const pagination = vine.create({
			page: vine.number().min(1).optional(),
			perPage: vine.number().min(1).max(100).optional(),
		});

		const spec = buildOpenApiSpec({
			routes: [{ name: 'api.v1.admin.identity.users.index', pattern: '/api/v1/admin/users', method: 'GET' }],
			docs,
			info,
			securitySchemes,
			pagination,
		});

		const byName = new Map<string, OpenApiParameter>(
			spec.paths['/api/v1/admin/users'].get.parameters!.map((p): [string, OpenApiParameter] => [p.name, p]),
		);

		assert.equal(byName.get('page')!.schema.type, 'number');
		assert.equal((byName.get('perPage')!.schema as { maximum?: number }).maximum, 100);
	});
});
