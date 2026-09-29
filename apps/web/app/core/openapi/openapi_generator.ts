import type {
	ApiOperationDoc,
	ApiRequestLocation,
	ApiRequestValidator,
	JsonSchema,
} from '#transport/core/openapi/api_docs_registry';

/** HTTP methods that carry JSON payloads or responses and are documented. */
const JSON_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/** One OpenAPI path parameter or query parameter entry. */
export interface OpenApiParameter {
	name: string;
	in: 'query' | 'path';
	required: boolean;
	description?: string;
	schema: JsonSchema;
}

/** One OpenAPI request body definition. */
export interface OpenApiRequestBody {
	required: boolean;
	content: Record<string, { schema: JsonSchema }>;
}

/** One OpenAPI response definition. */
export interface OpenApiResponse {
	description: string;
	content?: Record<string, { schema: JsonSchema }>;
}

/** One OpenAPI operation, keyed by lowercase method under its path. */
export interface OpenApiOperation {
	operationId: string;
	summary?: string;
	description?: string;
	tags?: string[];
	parameters?: OpenApiParameter[];
	requestBody?: OpenApiRequestBody;
	responses: Record<string, OpenApiResponse>;
	security?: Record<string, string[]>[];
}

/** Metadata identifying the documented API in the `info` block. */
export interface OpenApiInfo {
	/** Display name of the API. */
	title: string;
	/** Version of the API being documented. */
	version: string;
	/** Longer description, when one exists. */
	description?: string;
}

/** The generated OpenAPI 3.0 document. */
export interface OpenApiSpec {
	openapi: string;
	info: OpenApiInfo;
	servers: { url: string }[];
	paths: Record<string, Record<string, OpenApiOperation>>;
	components: {
		securitySchemes: Record<string, JsonSchema>;
	};
	tags?: { name: string }[];
}

/**
 * Plain, serializable description of one registered API route — the slice of
 * the framework's route registry the generator needs, kept decoupled from it
 * so the generator stays a pure, unit-testable function.
 */
export interface ApiRouteSummary {
	/** The route's full name, when it has one (e.g. `api.v1.admin.identity.users.index`). */
	name?: string;
	/** The full URL pattern with `:param` segments (e.g. `/api/v1/admin/users/:id`). */
	pattern: string;
	/** The HTTP method the route responds to (e.g. `GET`). */
	method: string;
}

/**
 * One security scheme, declared under `components.securitySchemes`.
 * Accepts any of the OpenAPI 3.0 scheme shapes (http bearer, apiKey cookie…).
 */
export type SecurityScheme = JsonSchema;

/** Everything the generator needs to build the spec for one API. */
export interface BuildOpenApiSpecInput {
	/** The registered routes, as plain summaries. */
	routes: ApiRouteSummary[];
	/** The docs metadata, keyed by full route name. */
	docs: ReadonlyMap<string, ApiOperationDoc>;
	/** The `info` block identifying the API. */
	info: OpenApiInfo;
	/** The security schemes to declare under `components.securitySchemes`. */
	securitySchemes: Record<string, SecurityScheme>;
	/**
	 * The shared pagination validator, so the `page` / `perPage` parameters of
	 * paginated endpoints carry the same constraints the endpoint enforces.
	 * Optional so the generator stays usable where no pagination exists.
	 */
	pagination?: ApiRequestValidator;
}

/**
 * Build the OpenAPI 3.0 document for one API from its routes and docs.
 *
 * Pure and deterministic: it reads the route summaries and the registered
 * docs, joins them by route name, and derives every other part of the spec
 * (path parameters, query parameters, request bodies, pagination parameters,
 * default responses, default security) from those two sources of truth.
 *
 * @param input - The routes, docs, info block, and security schemes.
 * @returns The generated OpenAPI 3.0 document.
 */
export function buildOpenApiSpec(input: BuildOpenApiSpecInput): OpenApiSpec {
	const { routes, docs, info, securitySchemes, pagination } = input;
	const paginationSchema = pagination ? normalizeSchema(pagination.toJSONSchema()) : undefined;

	const paths: OpenApiSpec['paths'] = {};
	const tagNames = new Set<string>();

	for (const route of routes) {
		if (!route.name || !isDocumentable(route)) {
			continue;
		}

		const doc = docs.get(route.name);
		const operation = buildOperation(route, doc, securitySchemes, paginationSchema);
		if (doc?.tags) {
			for (const tag of doc.tags) {
				tagNames.add(tag);
			}
		}

		const openApiPath = toOpenApiPath(route.pattern);
		(paths[openApiPath] ??= {})[route.method.toLowerCase()] = operation;
	}

	const spec: OpenApiSpec = {
		openapi: '3.0.3',
		info,
		servers: [{ url: '/' }],
		paths,
		components: { securitySchemes },
	};
	if (tagNames.size > 0) {
		spec.tags = [...tagNames].sort().map((name) => ({ name }));
	}
	return spec;
}

/**
 * Whether a route is part of the documented JSON API.
 *
 * @param route - The route summary.
 */
function isDocumentable(route: ApiRouteSummary): boolean {
	return route.pattern.startsWith('/api/v1') && JSON_METHODS.includes(route.method);
}

/**
 * Convert a route pattern to its OpenAPI form (`:id` → `{id}`).
 *
 * @param pattern - The route pattern.
 */
function toOpenApiPath(pattern: string): string {
	return pattern.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

/**
 * Extract the route parameter names from a pattern, in order.
 *
 * @param pattern - The route pattern.
 * @returns The parameter names (e.g. `['id']`).
 */
function extractPathParams(pattern: string): string[] {
	const names: string[] = [];
	for (const match of pattern.matchAll(/:([A-Za-z0-9_]+)/g)) {
		names.push(match[1]);
	}
	return names;
}

/**
 * Assemble the operation for one route from its docs metadata.
 */
function buildOperation(
	route: ApiRouteSummary,
	doc: ApiOperationDoc | undefined,
	securitySchemes: Record<string, SecurityScheme>,
	paginationSchema: JsonSchema | undefined,
): OpenApiOperation {
	const operation: OpenApiOperation = {
		operationId: route.name as string,
		responses: buildResponses(doc),
	};

	if (doc) {
		if (doc.summary) operation.summary = doc.summary;
		if (doc.description) operation.description = doc.description;
		if (doc.tags?.length) operation.tags = [...doc.tags];
	}

	const parameters = buildParameters(route, doc, paginationSchema);
	if (parameters.length > 0) operation.parameters = parameters;

	const requestBody = buildRequestBody(doc);
	if (requestBody) operation.requestBody = requestBody;

	const security = resolveSecurity(route.pattern, doc, securitySchemes);
	if (security) operation.security = security;

	return operation;
}

/**
 * The parameters of one operation: path parameters (schema optionally
 * derived from a path-carried validator), query parameters from a
 * query-carried validator, and the shared pagination parameters.
 */
function buildParameters(
	route: ApiRouteSummary,
	doc: ApiOperationDoc | undefined,
	paginationSchema: JsonSchema | undefined,
): OpenApiParameter[] {
	const parameters: OpenApiParameter[] = [];
	const pathSchema = requestSchemaFor(doc, 'path');
	const querySchema = requestSchemaFor(doc, 'query');

	for (const name of extractPathParams(route.pattern)) {
		const properties = (pathSchema?.properties ?? {}) as Record<string, JsonSchema>;
		parameters.push({
			name,
			in: 'path',
			required: true,
			schema: properties[name] ?? { type: 'string' },
		});
	}

	if (querySchema) {
		const requiredFields = Array.isArray(querySchema.required) ? (querySchema.required as string[]) : [];
		for (const [name, schema] of Object.entries(querySchema.properties ?? {})) {
			parameters.push({
				name,
				in: 'query',
				required: requiredFields.includes(name),
				schema: schema as JsonSchema,
			});
		}
	}

	if (doc?.paginated) {
		const properties = (paginationSchema?.properties ?? {}) as Record<string, JsonSchema>;
		const declared = new Set(parameters.map((parameter) => parameter.name));
		if (!declared.has('page')) {
			parameters.push({
				name: 'page',
				in: 'query',
				required: false,
				description: 'Page number.',
				schema: properties.page ?? { type: 'integer' },
			});
		}
		if (!declared.has('perPage')) {
			parameters.push({
				name: 'perPage',
				in: 'query',
				required: false,
				description: 'Items per page.',
				schema: properties.perPage ?? { type: 'integer' },
			});
		}
	}

	return parameters;
}

/**
 * The request body of one operation, from a body-carried validator.
 *
 * @returns The body definition, or `undefined` when the operation has no body.
 */
function buildRequestBody(doc: ApiOperationDoc | undefined): OpenApiRequestBody | undefined {
	const clause = doc?.request?.find((request) => request.in === 'body');
	const schema = requestSchemaFor(doc, 'body');
	if (!clause || !schema) return undefined;

	const requiredFields = Array.isArray(schema.required) ? (schema.required as string[]) : [];
	return {
		required: requiredFields.length > 0,
		content: { [clause.contentType ?? 'application/json']: { schema } },
	};
}

/**
 * The responses of one operation: the declared ones, or a bare `200`.
 */
function buildResponses(doc: ApiOperationDoc | undefined): Record<string, OpenApiResponse> {
	if (!doc?.responses) {
		return { '200': { description: 'Successful response.' } };
	}

	const responses: Record<string, OpenApiResponse> = {};
	for (const [code, response] of Object.entries(doc.responses)) {
		responses[code] = response.schema
			? { description: response.description, content: { 'application/json': { schema: response.schema } } }
			: { description: response.description };
	}
	return responses;
}

/**
 * The security requirements of one operation: the doc's explicit override,
 * otherwise the default (every declared scheme as an alternative) for admin
 * routes, and nothing for the rest.
 */
function resolveSecurity(
	pattern: string,
	doc: ApiOperationDoc | undefined,
	securitySchemes: Record<string, SecurityScheme>,
): Record<string, string[]>[] | undefined {
	if (doc?.security) {
		return doc.security.map((schemes) => Object.fromEntries(schemes.map((name) => [name, []])));
	}

	if (pattern.startsWith('/api/v1/admin')) {
		const schemeNames = Object.keys(securitySchemes);
		if (schemeNames.length > 0) {
			return schemeNames.map((name) => ({ [name]: [] }));
		}
	}

	return undefined;
}

/**
 * The normalized JSON Schema of the request validator carried in one location
 * (`path`, `query`, or `body`), or `undefined` when the operation declares
 * none there.
 */
function requestSchemaFor(doc: ApiOperationDoc | undefined, location: ApiRequestLocation): JsonSchema | undefined {
	const clause = doc?.request?.find((request) => request.in === location);
	if (!clause) return undefined;
	return normalizeSchema(clause.validator.toJSONSchema());
}

/**
 * Strip the empty `enum` and `required` arrays that Vine emits for dynamic or
 * fully-optional validators, so the spec stays clean.
 *
 * Also rewrites Vine's draft-7 nullability — a `type` array such as
 * `['integer', 'null']` — into the OpenAPI 3.0 shape: a single `type` plus a
 * `nullable: true` flag.
 *
 * @param schema - The JSON Schema to clean.
 * @returns A copy with empty arrays removed and nullable fields rewritten.
 */
function normalizeSchema(schema: JsonSchema): JsonSchema {
	const normalized: JsonSchema = {};
	for (const [key, value] of Object.entries(schema)) {
		if (Array.isArray(value)) {
			if (value.length === 0) continue;
			normalized[key] = value.map((item) =>
				typeof item === 'object' && item !== null ? normalizeSchema(item as JsonSchema) : item,
			);
		} else if (typeof value === 'object' && value !== null) {
			normalized[key] = normalizeSchema(value as JsonSchema);
		} else {
			normalized[key] = value;
		}
	}

	const type = normalized.type;
	if (Array.isArray(type) && type.includes('null')) {
		normalized.type = type.filter((item) => item !== 'null')[0];
		normalized.nullable = true;
	}

	return normalized;
}
