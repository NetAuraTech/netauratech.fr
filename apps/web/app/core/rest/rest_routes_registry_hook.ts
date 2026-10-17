import 'reflect-metadata';
import { promises as fs } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import type { ScannedController } from '@adonisjs/assembler/types';
import type { Dirent } from 'node:fs';

/**
 * The single home of the REST endpoint surface machinery for the Tuyau
 * codegen pipeline.
 *
 * The Assembler's route scanner resolves each route's request types by
 * parsing the controller method body for a Vine validator. Thin
 * REST-resource controllers (`await handle(ctx, this.usersResource.endpoints.show)`)
 * carry no inline validator: the `validator` step moved into the resource
 * declaration. The scanner therefore degrades those registry entries to
 * `body: {}` and drops the `422` union from `errorResponse` unless this module
 * recovers the association.
 *
 * The module's only public interface is the init-hook factory
 * {@link restRoutesRegistryHook}: composition registers it in the Assembler's
 * `hooks.init`, and the factory subscribes to the `routesScanning` event
 * internally — the event wiring is not visible from composition. For every
 * controller the scanner asks about, the internal resolver
 * ({@link RestEndpointManifest}) answers with the endpoint's `validator`
 * import record, or `undefined` to defer to the Assembler's default static
 * extraction.
 *
 * Resolution runs two internal strategies in order:
 * 1. **Runtime proxy trace** (primary): import the controller module, recover
 *    the injected resource class from the compiler-emitted
 *    `design:paramtypes` metadata, execute the method with a recording proxy
 *    resource and an aborting context, and read the first `endpoints.<key>`
 *    the method reaches.
 * 2. **AST source parse** (fallback): cover the cases the trace cannot run —
 *    a controller module that cannot be imported, or a dispatch method that
 *    reads the request before it touches any endpoint.
 *
 * Both strategies recover the `validator` import record from the resource
 * module's source, so the result mirrors the Assembler's `ScannedValidator[]`
 * shape and `prepareRequestTypes` reuses it unchanged: `InferInput<...>`
 * request types and the `422` error-response union come back for free.
 */

// ── Shared types ────────────────────────────────────────────────────────────

/** Validator reference shape consumed by the Tuyau/Assembler routes scanner. */
interface ExtractedValidator {
	name: string;
	import: {
		specifier: string;
		type: 'named' | 'default';
		value: string;
	};
}

/** The two pieces of a REST-resource delegation found in a controller method. */
interface RestDelegation {
	resourceVariable: string;
	endpoint: string;
}

/** The resource file backing a discovered REST resource class. */
interface ResourceRecord {
	file: string;
}

// ── Runtime trace strategy ──────────────────────────────────────────────────

/**
 * Error used to abort the runtime endpoint trace. The trace executes a real
 * controller method with a proxy context: the first `ctx` access throws this
 * exact instance, which the caller recognises to distinguish "the method
 * stopped where expected" from a genuine failure.
 */
const TRACE_ABORT = new Error('rest endpoint trace aborted');

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

// ── AST source-parse strategy ───────────────────────────────────────────────

/**
 * Read a text file, returning `undefined` on failure. The registry is a dev-
 * only artefact: a missing file must never break the dev server boot.
 *
 * @param file - Absolute path of the file to read.
 * @returns The file text, or `undefined` when it cannot be read.
 */
async function safeRead(file: string): Promise<string | undefined> {
	try {
		return await fs.readFile(file, 'utf8');
	} catch {
		return undefined;
	}
}

/**
 * Find a REST-resource delegation in a controller method body:
 * `handle(ctx, this\<resource\>.endpoints\<endpoint\>)`.
 *
 * The first capture is the injected resource variable, the second the endpoint
 * key of the REST resource. Returns `undefined` for methods that do not follow
 * the contract (hand-rolled controllers, `handleUpdate` dispatchers, ...).
 *
 * @param body - The controller method body, without the enclosing braces.
 * @returns The resource variable and endpoint key, or `undefined`.
 */
function findRestDelegation(body: string): RestDelegation | undefined {
	const match = body.match(/\bthis(?:\.\w+)*\s*\.\s*([A-Za-z_$][\w$]*)\s*\.\s*endpoints\s*\.\s*([A-Za-z_$][\w$]*)/);
	if (!match) return undefined;
	return { resourceVariable: match[1], endpoint: match[2] };
}

/**
 * Parse a TypeScript source file's import declarations into a map of local
 * names to their import specifier.
 *
 * Default, named and namespace imports are all recorded. A named import's key
 * is the local (aliased) name: `import { a as b } from 'x'` yields
 * `b -> 'x'`.
 *
 * @param sourceText - The file text to analyse.
 * @param fileName - Logical file name used by the parser for diagnostics.
 * @returns Map of local names to import specifier.
 */
function collectImportNames(sourceText: string, fileName = 'fixture.ts'): Map<string, string> {
	const sourceFile = ts.createSourceFile(fileName, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	const names = new Map<string, string>();
	for (const statement of sourceFile.statements) {
		if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) {
			continue;
		}
		const specifier = statement.moduleSpecifier.text;
		const clause = statement.importClause;
		if (!clause) continue;
		if (clause.name) names.set(clause.name.text, specifier);
		if (clause.namedBindings && ts.isNamedImports(clause.namedBindings)) {
			for (const element of clause.namedBindings.elements) {
				names.set(element.name.text, specifier);
			}
		}
		if (clause.namedBindings && ts.isNamespaceImport(clause.namedBindings)) {
			names.set(clause.namedBindings.name.text, specifier);
		}
	}
	return names;
}

/**
 * Locate the `endpoints` object literal on a REST resource class.
 *
 * The resource declares `readonly endpoints: <Type> = { ... }`; this returns
 * that object literal so callers can descend into individual endpoints.
 *
 * @param sourceText - Text of the resource module.
 * @returns The object-literal node holding the endpoints, or `undefined`.
 */
function findEndpointsLiteral(sourceText: string): ts.ObjectLiteralExpression | undefined {
	const sourceFile = ts.createSourceFile('resource.ts', sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
	let result: ts.ObjectLiteralExpression | undefined;
	const visit = (node: ts.Node): void => {
		if (result) return;
		if (ts.isPropertyDeclaration(node) || ts.isPropertyAssignment(node)) {
			const nameNode = node.name as ts.Node;
			const isEndpoints = (ts.isIdentifier(nameNode) || ts.isStringLiteral(nameNode)) && nameNode.text === 'endpoints';
			if (isEndpoints && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
				result = node.initializer;
				return;
			}
		}
		ts.forEachChild(node, visit);
	};
	visit(sourceFile);
	return result;
}

/**
 * Return the per-endpoint object literal for the given endpoint key.
 *
 * @param endpoints - The `endpoints` object literal.
 * @param endpoint - The endpoint key to look up.
 * @returns The endpoint's object-literal node, or `undefined`.
 */
function findEndpointInitializer(
	endpoints: ts.ObjectLiteralExpression,
	endpoint: string,
): ts.ObjectLiteralExpression | undefined {
	for (const property of endpoints.properties) {
		if (
			ts.isPropertyAssignment(property) &&
			property.name.getText() === endpoint &&
			ts.isObjectLiteralExpression(property.initializer)
		) {
			return property.initializer;
		}
	}
	return undefined;
}

/**
 * Return the initializer of the `validator` step of an endpoint.
 *
 * @param endpointInit - The per-endpoint object literal.
 * @returns The validator property's initializer node, or `undefined`.
 */
function findValidatorInitializer(endpointInit: ts.ObjectLiteralExpression): ts.Node | undefined {
	for (const property of endpointInit.properties) {
		if (ts.isPropertyAssignment(property) && property.name.getText() === 'validator') {
			return property.initializer;
		}
	}
	return undefined;
}

/**
 * Extract the Vine validator identifier referenced by a `validator` initializer.
 *
 * Two shapes the REST contract uses:
 * - `() => restIdValidator` — direct binding,
 * - `() => updateValidator(id, allowed)` — a factory call (the identifier is
 *   what gets mapped to a Vine module, not the arguments).
 *
 * Block-body functions are not supported (none in the current resources).
 *
 * @param node - The validator property initializer.
 * @returns The referenced identifier, or `undefined`.
 */
function extractValidatorIdentifier(node: ts.Node): string | undefined {
	if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
		const body = ts.isParenthesizedExpression(node.body) ? node.body.expression : node.body;
		return extractIdentifier(body);
	}
	if (ts.isIdentifier(node)) return node.text;
	return undefined;
}

function extractIdentifier(node: ts.Node): string | undefined {
	if (ts.isIdentifier(node)) return node.text;
	if (ts.isCallExpression(node) && node.expression) {
		return extractIdentifier(node.expression);
	}
	return undefined;
}

/**
 * Resolve the local identifier of a Vine validator into its import record.
 *
 * The identifier must be a named or default import of the resource module;
 * otherwise the record is `undefined` and the endpoint falls back to the
 * scanner's default (no-validator) extraction.
 *
 * @param sourceText - Text of the resource module.
 * @param identifier - Local identifier to resolve.
 * @returns The extracted validator record, or `undefined`.
 */
function resolveValidatorImport(sourceText: string, identifier: string): ExtractedValidator | undefined {
	const specifier = collectImportNames(sourceText).get(identifier);
	if (!specifier) return undefined;
	return {
		name: identifier,
		import: {
			specifier,
			type: 'named',
			value: identifier,
		},
	};
}

/**
 * Map a `#transport/<domain>/rest/<name>` import specifier to the absolute path of
 * the resource file. REST resources are co-located with their domain under
 * `app/<domain>/rest/`, and the domain is embedded in the specifier itself,
 * so the translation is mechanical — no TS import resolution is required.
 *
 * @param appRoot - Absolute path of the application root.
 * @param specifier - Import specifier as it appears in the controller's import.
 * @returns Absolute path of the resource file, or `undefined` when the
 *         specifier is not of the `#transport/<domain>/rest/*` form.
 */
function resolveResourceFile(appRoot: string, specifier: string): string | undefined {
	const match = specifier.match(/^#transport\/([\w$]+)\/rest\/([\w$]+)$/);
	if (!match) return undefined;
	return resolve(appRoot, 'app', match[1], 'rest', `${match[2].replace(/\.(ts|js)$/u, '')}.ts`);
}

/**
 * Find the method body of the named controller handler. A minimal
 * brace-counting parser is enough: the REST controllers are one-line
 * dispatchers.
 *
 * @param sourceText - Full text of the controller module.
 * @param method - Method name to locate.
 * @returns The method body (between the outermost braces), or `undefined`.
 */
function findMethodBody(sourceText: string, method: string): string | undefined {
	const signature = new RegExp(`\\b${method}\\s*\\(\\s*ctx\\s*:\\s*HttpContext\\s*\\)`).exec(sourceText);
	if (!signature) return undefined;
	const open = sourceText.indexOf('{', signature.index);
	if (open === -1) return undefined;
	let depth = 0;
	for (let i = open; i < sourceText.length; i += 1) {
		const ch = sourceText[i];
		if (ch === '{') depth += 1;
		else if (ch === '}') {
			depth -= 1;
			if (depth === 0) return sourceText.slice(open + 1, i);
		}
	}
	return undefined;
}

/**
 * Find the `#transport/<domain>/rest/<name>_resource` import specifier of a
 * resource variable inside a controller source.
 *
 * The constructor property is lowerCamelCase (`usersResource`) while the
 * imported class is PascalCase (`UsersResource`), so the match is done on the
 * shared base name (`users`) rather than on the binding name: every import
 * whose file base is `<base>_resource` is the resource declaration.
 *
 * @param sourceText - Full text of the controller module.
 * @param resourceVariable - The `this.<x>` variable found by the delegation
 *         matcher.
 * @returns The raw import specifier, or `undefined`.
 */
function findResourceSpecifier(sourceText: string, resourceVariable: string): string | undefined {
	const base = resourceVariable.replace(/Resource$/u, '');
	if (!base || base === resourceVariable) return undefined;
	for (const specifier of collectImportNames(sourceText).values()) {
		const match = specifier.match(/^#transport\/[\w$]+\/rest\/([\w$]+)$/u);
		if (!match) continue;
		const fileBase = match[1].replace(/_resource$/u, '');
		if (fileBase === base) return specifier;
	}
	return undefined;
}

/**
 * Extract the Vine validators referenced by the REST-resource endpoints
 * delegated to from a controller method, by parsing the controller and
 * resource source.
 *
 * This is the documented **fallback** of the endpoint resolution: the
 * primary path resolves the delegation at runtime by importing the resource
 * (see {@link RestEndpointManifest}); this parser covers the cases the
 * runtime trace cannot — a controller module that cannot be imported, or a
 * dispatch method that reads the request before it touches any endpoint.
 *
 * The result mirrors the Assembler's own `ScannedValidator[]` shape, so
 * `prepareRequestTypes` reuses it unchanged: `InferInput<...>` request types
 * and the `422` error-response union come back for free.
 *
 * @param appRoot - Absolute path of the application root.
 * @param controller - Scanned controller metadata from the Assembler.
 * @returns Single-element array on success, `undefined` when the delegation
 *         cannot be traced — the Assembler then falls back to its default
 *         static extraction.
 */
async function extractRestResourceValidators(
	appRoot: string,
	controller: ScannedController,
): Promise<ExtractedValidator[] | undefined> {
	const sourceText = await safeRead(controller.path);
	if (!sourceText) return undefined;
	const body = findMethodBody(sourceText, controller.method);
	if (!body) return undefined;
	const delegation = findRestDelegation(body);
	if (!delegation) return undefined;
	const specifier = findResourceSpecifier(sourceText, delegation.resourceVariable);
	if (!specifier) return undefined;
	const resourcePath = resolveResourceFile(appRoot, specifier);
	if (!resourcePath) return undefined;
	const resourceText = await safeRead(resourcePath);
	if (!resourceText) return undefined;

	const endpoints = findEndpointsLiteral(resourceText);
	if (!endpoints) return undefined;
	const endpointInit = findEndpointInitializer(endpoints, delegation.endpoint);
	if (!endpointInit) return undefined;
	const validatorNode = findValidatorInitializer(endpointInit);
	if (!validatorNode) return undefined;
	const identifier = extractValidatorIdentifier(validatorNode);
	if (!identifier) return undefined;
	const validator = resolveValidatorImport(resourceText, identifier);
	return validator ? [validator] : undefined;
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
class RestEndpointManifest {
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

/**
 * Minimal observable surface of the Assembler's RoutesScanner we consume:
 * the `extractValidators` registration point.
 */
interface RouteScannerSurface {
	extractValidators(
		cb: (route: unknown, controller: ScannedController) => Promise<ExtractedValidator[] | undefined>,
	): unknown;
}

/**
 * The hook bus we subscribe to. Only `routesScanning` is used by this hook.
 */
interface HookBus {
	add(event: 'routesScanning', cb: (devServer: unknown, routesScanner: RouteScannerSurface) => void): unknown;
}

/**
 * Init-hook parent we receive. The Assembler's `DevServer` exposes `cwdPath`
 * (absolute directory of the project root); that is all we need to import
 * the application's REST resources.
 */
interface InitHookParent {
	cwdPath?: string;
}

/**
 * AdonisJS init hook that installs a REST-resource-aware validator extractor
 * on the Assembler's `RoutesScanner`.
 *
 * The Tuyau client registry — and the Assembler's route scanning in general —
 * resolve request types by parsing the controller method body for a Vine
 * validator. Thin REST-resource controllers
 * (`await handle(ctx, this.usersResource.endpoints.show)`) no longer inline a
 * validator: the `validator` step moved into the resource declaration. The
 * scanner therefore degrades those registry entries to `body: {}` and drops
 * the `422` union from `errorResponse`.
 *
 * This hook subscribes to the `routesScanning` event, grabs the
 * `RoutesScanner` instance, and registers an `extractValidators` callback
 * backed by a {@link RestEndpointManifest}: for every REST-resource
 * delegation the manifest resolves the endpoint's `validator` step by
 * importing the resource and tracing the delegation at runtime, falling back
 * to source parsing when the trace cannot run. Every other controller makes
 * the callback return `undefined`, deferring to the Assembler's default
 * extraction.
 *
 * @example
 * // adonisrc.ts
 * import { restRoutesRegistryHook } from '#transport/core/rest/rest_routes_registry_hook'
 * export default defineConfig({
 *   hooks: {
 *     init: [
 *       // ...
 *       restRoutesRegistryHook(),
 *     ],
 *   },
 * })
 */
export function restRoutesRegistryHook(): {
	run(parent: InitHookParent, hooks: HookBus): void;
} {
	return {
		run(parent: InitHookParent, hooks: HookBus): void {
			const appRoot = parent.cwdPath ?? process.cwd();
			const manifest = new RestEndpointManifest(appRoot);
			hooks.add('routesScanning', (_devServer, routesScanner) => {
				routesScanner.extractValidators(async (_route, controller) => {
					return manifest.resolve(controller);
				});
			});
		},
	};
}
