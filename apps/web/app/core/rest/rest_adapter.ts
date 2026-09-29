import { type HttpContext } from '@adonisjs/core/http';
import { extractPagination } from '#transport/core/helpers/extract_pagination';
import { stripEmptyStrings } from '#transport/core/helpers/strip_empty_strings';
import { type PaginationFilters } from '#types/pagination';

/**
 * Input handed to every endpoint step: the raw request, the route params, the
 * request authenticator, and (when the endpoint is `paginated`) the validated
 * pagination filters.
 */
export interface RestEndpointContext {
	request: HttpContext['request'];
	params: HttpContext['params'];
	auth: HttpContext['auth'];
	pagination?: PaginationFilters;
}

/**
 * Structural contract for the validators consumed by REST endpoints.
 *
 * Every validator returned by `vine.create()` satisfies this shape, so both
 * static validators and validator factories plug in directly.
 */
export interface RestValidator<Payload> {
	validate(data: unknown): Promise<Payload>;
}

/**
 * Redirect target of a page mutation: the named route to send the client to,
 * and the parameters used to build its URL.
 */
export interface PageRedirect {
	route: string;
	params?: Record<string, unknown>;
}

/**
 * The page transport facet of an endpoint: how the shared request
 * interpretation is turned into a page response instead of a JSON one.
 *
 * An endpoint serves a page over display methods (GET/HEAD) through
 * `component` + `render`, and over mutating methods through `flash` +
 * `redirect`. A given endpoint declares one of the two pairs, matching the
 * method its page route exposes.
 *
 * @template Prepared Value produced by `prepare` (undefined when absent)
 * @template Payload Typed input produced by the validator
 * @template Result  Value returned by the domain action
 */
export interface PageEndpoint<Prepared = unknown, Payload = unknown, Result = unknown> {
	/** The Inertia component rendered for display methods. */
	component?: string;
	/** Builds the Inertia props for display methods. */
	render?(
		context: RestEndpointContext,
		prepared: Prepared,
		payload: Payload,
		result: Result,
	): Promise<Record<string, unknown>>;
	/** Builds the success flash message for mutating methods. */
	flash?(context: RestEndpointContext, prepared: Prepared, payload: Payload, result: Result): Promise<string> | string;
	/** Builds the redirect target for mutating methods. */
	redirect?(context: RestEndpointContext, prepared: Prepared, payload: Payload, result: Result): PageRedirect;
}

/**
 * Declarative description of a single REST endpoint.
 *
 * {@link handle} executes the steps in this fixed order:
 *
 * 1. `paginated` — validate the pagination parameters, stored on the context
 * 2. `input`     — pick the raw payload to validate (defaults to `request.all()`)
 * 3. `strip`     — drop empty-string entries from the input
 * 4. `prepare`   — endpoint-specific pre-validation work (e.g. role allowlists)
 * 5. `validator` — validate the input into a typed payload (optional, the
 *                  input is used as-is when absent)
 * 6. `execute`   — call the domain action
 * 7. `refetch`   — reload persisted state when the action result is not
 *                  serializable on its own
 * 8. `transform` — shape the entity, then serialize it with `ctx.serialize()`
 *
 * `status` overrides the success code: `201` on creation, `204` to send no
 * body. `wrap` overrides the response envelope: the serialized payload is
 * sent under that key (e.g. `{ templates: [...] }`) instead of the
 * serializer's default `data` wrapper, preserving endpoints that predate the
 * envelope convention.
 * Domain exceptions thrown by the action propagate untouched and are
 * shaped by the standard exception handler.
 *
 * `page` optionally carries the endpoint's page transport output
 * ({@link PageEndpoint}): the same resolved steps are turned into an Inertia
 * render or a flash + redirect by the page adapter instead of a JSON
 * response, so the request interpretation exists exactly once, shared by
 * both transports.
 *
 * @template Prepared Value produced by `prepare` (undefined when absent)
 * @template Payload Typed input produced by the validator
 * @template Result  Value returned by the domain action
 * @template Entity  Entity handed to `transform` (the action result when no refetch)
 */
export interface RestEndpoint<Prepared, Payload, Result, Entity> {
	paginated?: boolean;
	strip?: boolean;
	status?: 201 | 204;
	wrap?: string;
	input?: (context: RestEndpointContext) => unknown;
	prepare?: (context: RestEndpointContext) => Promise<Prepared>;
	validator?: (prepared: Prepared, context: RestEndpointContext) => RestValidator<Payload>;
	execute(context: RestEndpointContext, prepared: Prepared, payload: Payload): Promise<Result>;
	refetch?(context: RestEndpointContext, prepared: Prepared, payload: Payload, result: Result): Promise<Entity>;
	transform?(entity: Entity): unknown;
	page?: PageEndpoint<Prepared, Payload, Result>;
}

/**
 * Widened `RestEndpoint` that erases all type parameters.
 *
 * Used at dispatch sites where an endpoint is selected through a route key
 * rather than a literal type.
 */
export type AnyRestEndpoint = RestEndpoint<any, any, any, any>;

/**
 * Resolve the shared request interpretation of an endpoint: pagination,
 * input selection, strip, prepare, validate and execute — steps 1 to 6 of
 * the {@link RestEndpoint} pipeline.
 *
 * This is the transport-agnostic core of the contract: {@link handle}
 * turns the resolved result into a JSON response, while the page adapter
 * turns it into an Inertia page or a flash + redirect. Validation and
 * domain exceptions propagate untouched and are shaped by the standard
 * exception handler.
 *
 * @param ctx - The AdonisJS HTTP context.
 * @param endpoint - The declarative endpoint to resolve.
 * @returns The endpoint context, the prepared value, the validated payload
 *          and the domain action result.
 */
export async function resolveEndpoint<Prepared, Payload, Result, Entity>(
	ctx: HttpContext,
	endpoint: RestEndpoint<Prepared, Payload, Result, Entity>,
): Promise<{
	context: RestEndpointContext;
	prepared: Prepared;
	payload: Payload;
	result: Result;
}> {
	const context: RestEndpointContext = { request: ctx.request, params: ctx.params, auth: ctx.auth };

	if (endpoint.paginated) {
		context.pagination = await extractPagination(ctx.request);
	}

	let input: unknown = endpoint.input ? endpoint.input(context) : ctx.request.all();

	if (endpoint.strip) {
		input = stripEmptyStrings(input as Record<string, unknown>);
	}

	const prepared = endpoint.prepare ? await endpoint.prepare(context) : (undefined as unknown as Prepared);

	const payload: Payload = endpoint.validator
		? await endpoint.validator(prepared, context).validate(input)
		: (input as Payload);

	const result = await endpoint.execute(context, prepared, payload);

	return { context, prepared, payload, result };
}

/**
 * Signature shared by the REST and page adapters: take an HTTP context and
 * a declarative endpoint, run the shared request interpretation through
 * {@link resolveEndpoint}, and send the response over the adapter's
 * transport (JSON for the REST adapter, Inertia page or flash + redirect
 * for the page adapter).
 *
 * @param ctx - The AdonisJS HTTP context.
 * @param endpoint - The declarative endpoint to execute.
 * @returns Resolves once the response has been sent.
 */
export type AdapterHandler = (ctx: HttpContext, endpoint: AnyRestEndpoint) => Promise<unknown>;

/**
 * Run a declarative REST endpoint and send the JSON response.
 *
 * This is the only shared HTTP-level code of the REST resources: it carries
 * the transport mechanics (input selection, pagination, validation,
 * serialization, status codes) so resources stay pure declarations and
 * controllers stay thin adapters.
 *
 * @param ctx - The AdonisJS HTTP context.
 * @param endpoint - The declarative endpoint to execute.
 * @returns Resolves once the response has been sent.
 *
 * @example
 * async index(ctx: HttpContext): Promise<void> {
 *   await handle(ctx, this.usersResource.endpoints.index)
 * }
 */
export const handle: AdapterHandler = async (ctx, endpoint) => {
	const { context, prepared, payload, result } = await resolveEndpoint(ctx, endpoint);

	if (endpoint.status === 204) {
		ctx.response.noContent();
		return;
	}

	const entity = endpoint.refetch ? await endpoint.refetch(context, prepared, payload, result) : result;

	const serialized = endpoint.transform ? await ctx.serialize(endpoint.transform(entity)) : undefined;

	if (endpoint.wrap && serialized !== undefined) {
		const { data } = serialized as { data: unknown };

		ctx.response.status(endpoint.status ?? 200).send({ [endpoint.wrap]: data });
		return;
	}

	ctx.response.status(endpoint.status ?? 200).send(serialized);
};
