import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { test } from '@japa/runner';
import { RestEndpointManifest } from '#transport/core/rest/rest_endpoint_manifest';
import type { ScannedController } from '@adonisjs/assembler/types';

const APP_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));

const widgetResourceSource = `
import { inject } from '@adonisjs/core'
import { restIdValidator, updateValidator } from '#transport/identity/validators/user'

@inject()
export default class WidgetResource {
  constructor(protected service: unknown) {}

  readonly endpoints = {
    show: {
      input: (context) => context.params,
      validator: () => restIdValidator,
      execute: (_context, _prepared, payload) => payload,
    },
    details: {
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

/**
 * The resource import is relative: package specifiers always resolve against
 * the real app, so a hermetic fixture can only reach its sibling resource
 * file relatively.
 */
const widgetControllerSource = (importMarker: string, callMarker: string) => `
import { appendFileSync } from 'node:fs'
import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import WidgetResource from '../../rest/widget_resource.js'
import { handle } from '#transport/core/rest/rest_adapter'

appendFileSync(${JSON.stringify(importMarker)}, 'import\\n')

@inject()
export default class WidgetApiController {
  constructor(protected widgetResource: WidgetResource) {}

  async show(ctx: HttpContext): Promise<void> {
    appendFileSync(${JSON.stringify(callMarker)}, 'show\\n')
    await handle(ctx, this.widgetResource.endpoints.show)
  }

  async details(ctx: HttpContext): Promise<void> {
    appendFileSync(${JSON.stringify(callMarker)}, 'details\\n')
    await handle(ctx, this.widgetResource.endpoints.details)
  }

  async update(ctx: HttpContext): Promise<void> {
    await handle(ctx, this.widgetResource.endpoints.update)
  }

  async orphan(ctx: HttpContext): Promise<void> {
    await this.widgetResource.doNothing()
  }
}
`;

const gadgetResourceSource = `
import { inject } from '@adonisjs/core'
import { updateValidator } from '#transport/identity/validators/user'

@inject()
export default class GadgetResource {
  readonly endpoints = {
    show: {
      validator: () => updateValidator,
      execute: (_context, _prepared, payload) => payload,
    },
  }
}
`;

const gadgetControllerSource = `
import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import GadgetResource from '../../rest/gadget_resource.js'
import { handle } from '#transport/core/rest/rest_adapter'

@inject()
export default class GadgetApiController {
  constructor(protected gadgetResource: GadgetResource) {}

  async show(ctx: HttpContext): Promise<void> {
    await handle(ctx, this.gadgetResource.endpoints.show)
  }
}
`;

/**
 * This controller imports its resource through a package specifier pointing at
 * the fixture domain: at runtime the import fails (the real app has no such
 * domain), so only the source-parser fallback can resolve the validator.
 */
const brokenControllerSource = `
import { inject } from '@adonisjs/core'
import { type HttpContext } from '@adonisjs/core/http'
import BrokenResource from '#transport/brokindom/rest/broken_resource'
import { handle } from '#transport/core/rest/rest_adapter'

@inject()
export default class BrokenApiController {
  constructor(protected brokenResource: BrokenResource) {}

  async show(ctx: HttpContext): Promise<void> {
    await handle(ctx, this.brokenResource.endpoints.show)
  }
}
`;

const brokenResourceSource = `
import { inject } from '@adonisjs/core'
import { restIdValidator } from '#transport/identity/validators/user'

@inject()
export default class BrokenResource {
  readonly endpoints = {
    show: {
      validator: () => restIdValidator,
      execute: (_context, _prepared, payload) => payload,
    },
  }
}
`;

/**
 * Build a throw-away app root inside the workspace `tmp/` directory (git-
 * ignored) so fixture modules stay inside the `@foundry/web` package scope
 * and their `#transport/*` imports resolve against the real application.
 */
async function createFixtureAppRoot(): Promise<string> {
	await mkdir(join(APP_ROOT, 'tmp'), { recursive: true });
	const root = await mkdtemp(join(APP_ROOT, 'tmp', 'rest-manifest-'));
	await mkdir(join(root, 'app/fixturedom/controllers/api'), { recursive: true });
	await mkdir(join(root, 'app/fixturedom/rest'), { recursive: true });
	await mkdir(join(root, 'app/gadgetdom/controllers/api'), { recursive: true });
	await mkdir(join(root, 'app/gadgetdom/rest'), { recursive: true });
	await mkdir(join(root, 'app/brokindom/controllers/api'), { recursive: true });
	await mkdir(join(root, 'app/brokindom/rest'), { recursive: true });
	await writeFile(join(root, 'app/fixturedom/rest/widget_resource.ts'), widgetResourceSource);
	await writeFile(
		join(root, 'app/fixturedom/controllers/api/widget_api_controller.ts'),
		widgetControllerSource(join(root, 'widget-imports'), join(root, 'widget-calls')),
	);
	await writeFile(join(root, 'app/gadgetdom/rest/gadget_resource.ts'), gadgetResourceSource);
	await writeFile(join(root, 'app/gadgetdom/controllers/api/gadget_api_controller.ts'), gadgetControllerSource);
	await writeFile(join(root, 'app/brokindom/rest/broken_resource.ts'), brokenResourceSource);
	await writeFile(join(root, 'app/brokindom/controllers/api/broken_api_controller.ts'), brokenControllerSource);
	return root;
}

function makeController(
	appRoot: string,
	domain: 'fixturedom' | 'gadgetdom' | 'brokindom',
	method: string,
): ScannedController {
	const name =
		domain === 'fixturedom'
			? 'widget_api_controller'
			: domain === 'gadgetdom'
				? 'gadget_api_controller'
				: 'broken_api_controller';
	const path = join(appRoot, 'app', domain, 'controllers', 'api', `${name}.ts`);
	return {
		name: `${name}_controller`,
		path,
		method,
		import: {
			type: 'default',
			specifier: pathToFileURL(path).href,
			value: 'Controller',
		},
	};
}

test.group('rest endpoint manifest', () => {
	let appRoot: string;

	test('resolves the endpoint validator by importing the controller and resource', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.deepEqual(await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'fixturedom', 'show')), [
				{
					name: 'restIdValidator',
					import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'restIdValidator' },
				},
			]);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('follows a renamed endpoint key from the imported code', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.deepEqual(
				await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'fixturedom', 'details')),
				[
					{
						name: 'restIdValidator',
						import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'restIdValidator' },
					},
				],
			);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('follows a swapped validator binding from the imported code', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.deepEqual(await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'gadgetdom', 'show')), [
				{
					name: 'updateValidator',
					import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'updateValidator' },
				},
			]);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('resolves factory validators to their identifier', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.deepEqual(
				await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'fixturedom', 'update')),
				[
					{
						name: 'updateValidator',
						import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'updateValidator' },
					},
				],
			);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('returns undefined for methods that do not delegate to an endpoint', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.isUndefined(
				await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'fixturedom', 'orphan')),
			);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('falls back to the source parser when the controller module cannot be imported', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			assert.deepEqual(await new RestEndpointManifest(appRoot).resolve(makeController(appRoot, 'brokindom', 'show')), [
				{
					name: 'restIdValidator',
					import: { specifier: '#transport/identity/validators/user', type: 'named', value: 'restIdValidator' },
				},
			]);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});

	test('imports the controller module once and traces each method once', async ({ assert }) => {
		appRoot = await createFixtureAppRoot();
		try {
			const manifest = new RestEndpointManifest(appRoot);
			const first = await manifest.resolve(makeController(appRoot, 'fixturedom', 'show'));
			const second = await manifest.resolve(makeController(appRoot, 'fixturedom', 'show'));
			const third = await manifest.resolve(makeController(appRoot, 'fixturedom', 'details'));

			assert.strictEqual(first, second);
			assert.deepEqual(third, first);
			assert.equal((await readFile(join(appRoot, 'widget-imports'), 'utf8')).trim(), 'import');
			assert.deepEqual((await readFile(join(appRoot, 'widget-calls'), 'utf8')).trim().split('\n'), ['show', 'details']);
		} finally {
			await rm(appRoot, { recursive: true, force: true });
		}
	});
});
