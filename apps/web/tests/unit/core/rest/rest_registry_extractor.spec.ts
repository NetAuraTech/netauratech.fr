import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from '@japa/runner';
import {
	collectImportNames,
	extractRestResourceValidators,
	extractValidatorIdentifier,
	findEndpointInitializer,
	findEndpointsLiteral,
	findRestDelegation,
	findValidatorInitializer,
	resolveValidatorImport,
} from '#transport/core/rest/rest_registry_extractor';
import type { ScannedController } from '@adonisjs/assembler/types';

const controllerSource = `
import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import UsersResource from '#transport/identity/rest/users_resource'
import { handle } from '#transport/core/rest/rest_adapter'

@inject()
export default class UsersShowApiController {
  constructor(protected usersResource: UsersResource) {}

  async show(ctx: HttpContext): Promise<void> {
    await handle(ctx, this.usersResource.endpoints.show)
  }

  async update(ctx: HttpContext): Promise<void> {
    await this.usersResource.doSomethingElse()
  }
}
`;

const resourceSource = `
import { restIdValidator, updateValidator } from '#transport/identity/validators/user'

export default class UsersResource {
  readonly endpoints = {
    show: {
      input: (context) => context.params,
      validator: () => restIdValidator,
      execute: (_context, _prepared, payload) => payload,
    },
    update: {
      validator: (prepared) => updateValidator(prepared.id, prepared.allowed),
      execute: (_context, _prepared, payload) => payload,
    },
  }
}
`;

/** Extract the property names of an `endpoints` object literal for assertions. */
function endpointNames(endpoints: ReturnType<typeof findEndpointsLiteral>): string[] | undefined {
	if (!endpoints) return undefined;
	return endpoints.properties.map((p) => (p as { name: { getText(): string } }).name.getText());
}

test.group('rest registry extractor', () => {
	test('finds the resource variable and endpoint of a delegation', ({ assert }) => {
		const body = 'await handle(ctx, this.usersResource.endpoints.show)';
		assert.deepEqual(findRestDelegation(body), {
			resourceVariable: 'usersResource',
			endpoint: 'show',
		});
	});

	test('ignores method bodies without a REST delegation', ({ assert }) => {
		assert.isUndefined(findRestDelegation('await this.usersResource.doSomethingElse()'));
		assert.isUndefined(findRestDelegation('return ctx.response.json(1)'));
	});

	test('maps local import names to specifiers', ({ assert }) => {
		const names = collectImportNames(controllerSource);
		assert.equal(names.get('UsersResource'), '#transport/identity/rest/users_resource');
		assert.equal(names.get('handle'), '#transport/core/rest/rest_adapter');
		assert.equal(names.get('inject'), '@adonisjs/core');
	});

	test('locates the endpoints object literal of a resource', ({ assert }) => {
		assert.deepEqual(endpointNames(findEndpointsLiteral(resourceSource)), ['show', 'update']);
	});

	test('does not confuse unrelated object literals with endpoints', ({ assert }) => {
		const source = `
      export default class Fake {
        readonly other = { a: 1 }
        readonly endpoints = { show: { validator: () => v } }
      }
    `;
		assert.deepEqual(endpointNames(findEndpointsLiteral(source)), ['show']);
	});

	test('descends to a single endpoint and its validator initializer', ({ assert }) => {
		const endpoints = findEndpointsLiteral(resourceSource);
		assert.exists(endpoints);
		const endpoint = findEndpointInitializer(endpoints!, 'show');
		assert.exists(endpoint);
		assert.equal(findValidatorInitializer(endpoint!)?.getText(), '() => restIdValidator');
	});

	test('extracts direct and factory validator identifiers', ({ assert }) => {
		const endpoints = findEndpointsLiteral(resourceSource);
		const show = findEndpointInitializer(endpoints!, 'show');
		assert.equal(extractValidatorIdentifier(findValidatorInitializer(show!)!), 'restIdValidator');
		const update = findEndpointInitializer(endpoints!, 'update');
		assert.equal(extractValidatorIdentifier(findValidatorInitializer(update!)!), 'updateValidator');
	});

	test('resolves a validator identifier to its import record', ({ assert }) => {
		assert.deepEqual(resolveValidatorImport(resourceSource, 'restIdValidator'), {
			name: 'restIdValidator',
			import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'restIdValidator' },
		});
		assert.isUndefined(resolveValidatorImport(resourceSource, 'notImported'));
	});
});

/**
 * Creates a throw-away app root with one REST controller and its resource,
 * so the trace stays hermetic instead of depending on the checked-in files.
 */
async function createFakeAppRoot(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), 'rest-registry-'));
	await mkdir(join(root, 'app/identity/controllers/api'), { recursive: true });
	await mkdir(join(root, 'app/identity/rest'), { recursive: true });
	await writeFile(join(root, 'app/identity/controllers/api/users_show_api_controller.ts'), controllerSource);
	await writeFile(join(root, 'app/identity/rest/users_resource.ts'), resourceSource);
	return root;
}

test.group('extractRestResourceValidators', () => {
	let appRoot: string;

	test('traces a delegation to the resource validator', async ({ assert }) => {
		appRoot = await createFakeAppRoot();
		try {
			const controller = {
				path: join(appRoot, 'app/identity/controllers/api/users_show_api_controller.ts'),
				method: 'show',
			} as ScannedController;
			assert.deepEqual(await extractRestResourceValidators(appRoot, controller), [
				{
					name: 'restIdValidator',
					import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'restIdValidator' },
				},
			]);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('falls back to the scanner default for non-delegating methods', async ({ assert }) => {
		appRoot = await createFakeAppRoot();
		try {
			const controller = {
				path: join(appRoot, 'app/identity/controllers/api/users_show_api_controller.ts'),
				method: 'update',
			} as ScannedController;
			assert.isUndefined(await extractRestResourceValidators(appRoot, controller));
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('falls back when the controller file is missing', async ({ assert }) => {
		appRoot = await createFakeAppRoot();
		try {
			const controller = {
				path: join(appRoot, 'app/identity/controllers/api/does_not_exist.ts'),
				method: 'show',
			} as ScannedController;
			assert.isUndefined(await extractRestResourceValidators(appRoot, controller));
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});
});
