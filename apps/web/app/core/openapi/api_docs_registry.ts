import type { RestValidator } from '#transport/core/rest/rest_adapter';

/**
 * JSON Schema fragment (Draft 7 subset) embedded in the generated OpenAPI
 * document. Kept opaque on purpose: the fragments come from Vine's
 * `toJSONSchema()` and from hand-declared response shapes.
 */
export type JsonSchema = Record<string, unknown>;

/** A documented API response: the human description plus an optional body schema. */
export interface ApiResponseDoc {
	/** Human-readable explanation of when the response occurs. */
	description: string;
	/** JSON Schema of the JSON body, when the response carries one. */
	schema?: JsonSchema;
}

/**
 * Where the endpoint's validated input is carried.
 *
 * - `body` — the JSON request body (POST/PUT/PATCH)
 * - `query` — the query string (GET)
 * - `path` — the route parameters (`:id`)
 */
export type ApiRequestLocation = 'body' | 'query' | 'path';

/**
 * Structural contract for the validators consumed by the docs registry.
 *
 * Every validator returned by `vine.create()` satisfies it: in addition to
 * the {@link RestValidator} surface shared with the REST endpoints, Vine
 * exposes `toJSONSchema()`, from which the request schemas of the generated
 * spec are derived — the same validator the endpoint executes is the single
 * source of its documented shape.
 */
export interface ApiRequestValidator extends RestValidator<unknown> {
	/** JSON Schema (Draft 7) of the validated input, as produced by Vine. */
	toJSONSchema(): JsonSchema;
}

/**
 * Declarative documentation metadata for one registered API route.
 *
 * Registered against the route itself at its declaration site (via
 * {@link registerApiDoc}); the OpenAPI generator joins the metadata to the
 * route registry by the route's derived name, so paths, methods, and route
 * names can never drift from the routes themselves.
 */
export interface ApiOperationDoc {
	/** One-line summary rendered in the docs UI and the spec. */
	summary: string;
	/** Longer description, when the summary is not enough. */
	description?: string;
	/** Tag names grouping the operation in the docs UI (e.g. `['Users']`). */
	tags?: readonly string[];
	/**
	 * The request inputs, one entry per location the endpoint validates. Most
	 * endpoints carry a single entry; an update endpoint validates its `:id`
	 * path parameter and its body, so it carries two. Each validator is the
	 * very same one the endpoint runs, keeping the documented shape in lockstep
	 * with the enforced one.
	 */
	request?: readonly {
		validator: ApiRequestValidator;
		in: ApiRequestLocation;
		/**
		 * MIME type of the request entry, for `body` locations only. Defaults
		 * to `application/json`; multipart uploads declare
		 * `multipart/form-data`.
		 */
		contentType?: string;
	}[];
	/** The endpoint paginates — the shared `page` / `perPage` parameters are added. */
	paginated?: boolean;
	/** Declared responses keyed by status code; defaults to a bare `200` when absent. */
	responses?: Record<string, ApiResponseDoc>;
	/** Explicit security requirements, overriding the path-based default. */
	security?: readonly (readonly string[])[];
}

/**
 * Minimal surface of a registered route the docs registry needs: the route's
 * fully composed name, group prefixes included. The framework's `Route`
 * instances satisfy it through `getName()`, which is typed `string | undefined`
 * because the framework allows unnamed routes.
 */
export interface NamedRoute {
	/** The route's fully composed name (e.g. `api.v1.auth.login.execute`). */
	getName(): string | undefined;
}

/** Docs metadata keyed by the route it was registered on. */
const apiDocs = new Map<NamedRoute, ApiOperationDoc>();

/**
 * Resolve the registered docs into a name-keyed map, deriving every route
 * name at read time — by then the group chains have composed their prefixes
 * onto the route names.
 *
 * @returns A fresh map of route name → docs metadata.
 */
function resolvedApiDocs(): ReadonlyMap<string, ApiOperationDoc> {
	const resolved = new Map<string, ApiOperationDoc>();

	for (const [route, doc] of apiDocs) {
		// Every documented route is named (`.as()` or derived from its
		// handler); unnamed routes cannot be matched by name and are skipped.
		const name = route.getName();
		if (name === undefined) continue;
		resolved.set(name, doc);
	}

	return resolved;
}

/**
 * Register the docs metadata of one API route, keyed by the route itself.
 *
 * Called at the route's declaration site so the route and its documentation
 * live in a single place. The route name is derived from the route when the
 * registry is read — never hand-assembled — so it cannot drift from the
 * route's own name. Re-registering a route overwrites the previous entry,
 * which keeps the registry idempotent when the route module is imported
 * twice.
 *
 * @typeParam R The registered route (the framework's `Route` instances).
 * @param route - The route the docs describe.
 * @param doc - The operation metadata to associate with the route.
 * @returns The route, unchanged, so the call can lead the declaration chain.
 */
export function registerApiDoc<R extends NamedRoute>(route: R, doc: ApiOperationDoc): R {
	apiDocs.set(route, doc);
	return route;
}

/**
 * Retrieve the docs metadata registered for one route name.
 *
 * @param routeName - The route's full name.
 * @returns The registered metadata, or `undefined` when the route is undocumented.
 */
export function getApiDoc(routeName: string): ApiOperationDoc | undefined {
	return resolvedApiDocs().get(routeName);
}

/**
 * Every registered doc, keyed by the route's full name.
 *
 * @returns A fresh name-keyed view of the registry (names derived at read time).
 */
export function allApiDocs(): ReadonlyMap<string, ApiOperationDoc> {
	return resolvedApiDocs();
}
