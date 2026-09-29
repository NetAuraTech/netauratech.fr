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
 * Registered under the route's full name by the domain's transport code at
 * import time; the OpenAPI generator joins the metadata to the route
 * registry, so paths, methods, and route names can never drift from the
 * routes themselves.
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

/** Route name → docs metadata, registered at import time by the route modules. */
const apiDocs = new Map<string, ApiOperationDoc>();

/**
 * Register the docs metadata of one API route, keyed by its full route name.
 *
 * Re-registering a name overwrites the previous entry, which keeps the
 * registry idempotent when the route module is imported twice.
 *
 * @param routeName - The route's full name (e.g. `api.v1.admin.identity.users.index`).
 * @param doc - The operation metadata to associate with that route.
 */
export function registerApiDoc(routeName: string, doc: ApiOperationDoc): void {
	apiDocs.set(routeName, doc);
}

/**
 * Retrieve the docs metadata registered for one route name.
 *
 * @param routeName - The route's full name.
 * @returns The registered metadata, or `undefined` when the route is undocumented.
 */
export function getApiDoc(routeName: string): ApiOperationDoc | undefined {
	return apiDocs.get(routeName);
}

/**
 * Every registered doc, keyed by route name.
 *
 * @returns The live registry map (read-only view for consumers).
 */
export function allApiDocs(): ReadonlyMap<string, ApiOperationDoc> {
	return apiDocs;
}

/**
 * Drop every registered doc.
 *
 * Test isolation only — the registry is populated at import time and must
 * survive for the lifetime of the process in the running app.
 */
export function clearApiDocs(): void {
	apiDocs.clear();
}
