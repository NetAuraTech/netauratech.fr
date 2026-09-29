import { RestEndpointManifest } from './rest_endpoint_manifest.js';
import type { ExtractedValidator } from './rest_registry_extractor.js';
import type { ScannedController } from '@adonisjs/assembler/types';

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
