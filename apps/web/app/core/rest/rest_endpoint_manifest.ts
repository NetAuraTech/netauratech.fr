import 'reflect-metadata';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
	extractRestResourceValidators,
	extractValidatorIdentifier,
	findEndpointInitializer,
	findEndpointsLiteral,
	findValidatorInitializer,
	resolveValidatorImport,
	safeRead,
	type ExtractedValidator,
} from './rest_registry_extractor.js';
import type { ScannedController } from '@adonisjs/assembler/types';
import type { Dirent } from 'node:fs';

/**
 * Error used to abort the runtime endpoint trace. The trace executes a real
 * controller method with a proxy context: the first `ctx` access throws this
 * exact instance, which the caller recognises to distinguish "the method
 * stopped where expected" from a genuine failure.
 */
const TRACE_ABORT = new Error('rest endpoint trace aborted');

/** The resource file backing a discovered REST resource class. */
interface ResourceRecord {
	file: string;
}

/**
 * Read the compiler-emitted constructor parameter types of a class.
 *
 * The same metadata the IoC container consumes through `@inject()`: with
 * `emitDecoratorMetadata` enabled, the TS compiler records the declared
 * parameter classes, so the injected REST resource is recoverable from the
 * controller class alone — no source parsing.
 *
 * @param Ctor - The class to inspect.
 * @returns The constructor parameter types, or an empty array when the
 *         metadata is absent.
 */
function paramTypesOf(Ctor: object): object[] {
	const meta = Reflect.getMetadata('design:paramtypes', Ctor);
	return Array.isArray(meta) ? (meta as object[]) : [];
}

/**
 * Return the default export of a module namespace.
 *
 * @param module - The imported module namespace.
 * @returns The default export, or `undefined`.
 */
function defaultExport(module: unknown): unknown {
	return (module as { default?: unknown } | undefined)?.default;
}

/**
 * Import a module by specifier, falling back to the module's file URL when
 * the specifier does not resolve (e.g. a fixture domain that exists only on
 * disk, not in the application's import map).
 *
 * @param specifier - Import specifier to try first.
 * @param fallbackFile - Absolute path of the module file.
 * @returns The imported module namespace.
 */
async function importModule(specifier: string, fallbackFile: string): Promise<unknown> {
	try {
		return await import(specifier);
	} catch {
		return import(pathToFileURL(fallbackFile).href);
	}
}

/**
 * Build a proxy that throws {@link TRACE_ABORT} on any property access.
 *
 * Stands in for constructor dependencies and the HTTP context during the
 * trace: touching one stops execution before any real work (database query,
 * validation, response) can run.
 *
 * @returns An object aborting the trace on access.
 */
function abortingProxy(): object {
	return new Proxy(
		{},
		{
			get(_target, prop) {
				if (prop === 'then') return undefined;
				throw TRACE_ABORT;
			},
		},
	);
}

/**
 * Build the inert endpoint object handed to the traced method.
 *
 * A recursive proxy: every property — including the `page` declaration the
 * page adapter requires before resolving — is itself a truthy inert
 * endpoint, so the trace always reaches the designed abort point (the first
 * `ctx` access inside `resolveEndpoint`) instead of a missing-declaration
 * error. Calling or constructing the endpoint aborts the trace outright.
 *
 * @returns The inert endpoint object.
 */
function createInertEndpoint(): object {
	const handler: ProxyHandler<object> = {
		get(_target, prop) {
			if (prop === 'then') return undefined;
			return endpoint;
		},
		apply() {
			throw TRACE_ABORT;
		},
		construct() {
			throw TRACE_ABORT;
		},
	};
	const endpoint: object = new Proxy({}, handler);
	return endpoint;
}

/**
 * Build the fake REST resource handed to a controller during the trace.
 *
 * Its `endpoints` member is a proxy recording every accessed key and handing
 * back an inert endpoint object, so the first `endpoints.<key>` the method
 * reaches through `handle` identifies the endpoint the route serves.
 *
 * @param records - List the accessed endpoint keys are appended to.
 * @returns The fake resource object.
 */
function createRecordingResource(records: string[]): object {
	const endpoint = createInertEndpoint();
	const endpoints = new Proxy(
		{},
		{
			get(_target, prop) {
				if (typeof prop === 'string' && prop !== 'then') records.push(prop);
				return endpoint;
			},
		},
	);
	return { endpoints };
}

/**
 * Resolve the Vine validators of the REST endpoints a controller method
 * serves, by importing the code and tracing the delegation at runtime.
 *
 * The Assembler's route scanner resolves request types by parsing the
 * controller method body for a Vine validator. Thin REST-resource controllers
 * (`await handle(ctx, this.usersResource.endpoints.show)`) carry no inline
 * validator: the `validator` step moved into the resource declaration.
 *
 * This manifest resolves the association the way the runtime does: it
 * imports the controller module, recovers the injected resource class from
 * the compiler-emitted `design:paramtypes` (the same metadata the IoC
 * container reads through `@inject()`), executes the method with a
 * recording proxy resource and an aborting context, and reads the first
 * `endpoints.<key>` the method reaches. The endpoint's `validator` import
 * record is then recovered from the resource module. Both transports are
 * traced identically: the inert endpoint presents a truthy `page`
 * declaration, so the page adapter reaches the same `ctx` abort inside
 * `resolveEndpoint` as the JSON adapter.
 *
 * When the runtime trace cannot run — the controller module cannot be
 * imported, or the method reads the request before it touches any endpoint
 * (e.g. `handleUpdate` discriminators) — the documented fallback is the
 * source parser {@link extractRestResourceValidators}.
 *
 * Resolutions are memoized per controller method: the scanner asks once per
 * route, and the result is a pure function of the method.
 */
export class RestEndpointManifest {
	#appRoot: string;
	#resources: Promise<Map<object, ResourceRecord>> | undefined;
	#byMethod = new Map<string, ExtractedValidator[] | undefined>();

	/**
	 * @param appRoot - Absolute path of the application root.
	 */
	constructor(appRoot: string) {
		this.#appRoot = appRoot;
	}

	/**
	 * Resolve the validators of the endpoint served by a controller method.
	 *
	 * @param controller - Scanned controller metadata from the Assembler.
	 * @returns Single-element array on success, `undefined` when neither the
	 *         runtime trace nor the source fallback can trace the delegation.
	 */
	async resolve(controller: ScannedController): Promise<ExtractedValidator[] | undefined> {
		const key = `${controller.path}::${controller.method}`;
		if (this.#byMethod.has(key)) return this.#byMethod.get(key);

		let result: ExtractedValidator[] | undefined;
		try {
			result = await this.#trace(controller);
		} catch {
			result = undefined;
		}
		if (!result) {
			result = await extractRestResourceValidators(this.#appRoot, controller);
		}
		this.#byMethod.set(key, result);
		return result;
	}

	/**
	 * Discover every REST resource of the application: import each
	 * `app/<domain>/rest/*_resource.ts` module once and index its default
	 * export by class identity.
	 *
	 * @returns Map of resource class to its file record.
	 */
	#discoverResources(): Promise<Map<object, ResourceRecord>> {
		if (!this.#resources) {
			this.#resources = (async () => {
				const registry = new Map<object, ResourceRecord>();
				const appDir = join(this.#appRoot, 'app');
				let domains: Dirent[];
				try {
					domains = await readdir(appDir, { withFileTypes: true });
				} catch {
					return registry;
				}
				for (const domain of domains) {
					if (!domain.isDirectory()) continue;
					const restDir = join(appDir, domain.name, 'rest');
					let entries: Dirent[];
					try {
						entries = await readdir(restDir, { withFileTypes: true });
					} catch {
						continue;
					}
					for (const entry of entries) {
						if (!entry.isFile() || !entry.name.endsWith('_resource.ts')) continue;
						const base = entry.name.slice(0, -3);
						const file = join(restDir, entry.name);
						const module = await importModule(`#transport/${domain.name}/rest/${base}`, file).catch(() => undefined);
						const Ctor = defaultExport(module);
						if (typeof Ctor === 'function') registry.set(Ctor, { file });
					}
				}
				return registry;
			})();
		}
		return this.#resources;
	}

	/**
	 * Trace the endpoint delegation of a controller method at runtime.
	 *
	 * @param controller - Scanned controller metadata from the Assembler.
	 * @returns The traced validator records, or `undefined` when the trace
	 *         cannot run or reaches no endpoint.
	 */
	#trace(controller: ScannedController): Promise<ExtractedValidator[] | undefined> {
		return (async () => {
			const resources = await this.#discoverResources();
			const controllerModule = await importModule(controller.import.specifier, controller.path);
			const Controller = defaultExport(controllerModule);
			if (typeof Controller !== 'function') return undefined;

			const fakes: { records: string[]; file: string }[] = [];
			const args: unknown[] = [];
			for (const dep of paramTypesOf(Controller)) {
				const record = dep instanceof Function ? resources.get(dep) : undefined;
				if (record) {
					const records: string[] = [];
					fakes.push({ records, file: record.file });
					args.push(createRecordingResource(records));
				} else {
					args.push(abortingProxy());
				}
			}
			if (fakes.length === 0) return undefined;

			const instance = new (Controller as new (...args: unknown[]) => unknown)(...args);
			const method = (instance as Record<string, unknown>)[controller.method];
			if (typeof method !== 'function') return undefined;

			try {
				await (method as (ctx: unknown) => Promise<unknown>).call(instance, abortingProxy());
			} catch (error) {
				if (error !== TRACE_ABORT) return undefined;
			}

			for (const fake of fakes) {
				const endpoint = fake.records[0];
				if (endpoint) return this.#validatorFor(fake.file, endpoint);
			}
			return undefined;
		})();
	}

	/**
	 * Recover the `validator` import record of an endpoint from its resource
	 * module.
	 *
	 * @param resourceFile - Absolute path of the resource file.
	 * @param endpoint - The endpoint key reached by the trace.
	 * @returns Single-element array on success, `undefined` when the endpoint
	 *         declares no resolvable validator.
	 */
	async #validatorFor(resourceFile: string, endpoint: string): Promise<ExtractedValidator[] | undefined> {
		const resourceText = await safeRead(resourceFile);
		if (!resourceText) return undefined;
		const endpoints = findEndpointsLiteral(resourceText);
		if (!endpoints) return undefined;
		const endpointInit = findEndpointInitializer(endpoints, endpoint);
		if (!endpointInit) return undefined;
		const validatorNode = findValidatorInitializer(endpointInit);
		if (!validatorNode) return undefined;
		const identifier = extractValidatorIdentifier(validatorNode);
		if (!identifier) return undefined;
		const validator = resolveValidatorImport(resourceText, identifier);
		return validator ? [validator] : undefined;
	}
}
