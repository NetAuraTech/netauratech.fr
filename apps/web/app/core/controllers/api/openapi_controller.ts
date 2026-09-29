import { inject } from '@adonisjs/core';
import router from '@adonisjs/core/services/router';
import UnauthorizedException from '#auth/exceptions/unauthorized_exception';
import { enabledAuthGuards } from '#config/auth';
import { sessionCookieName } from '#config/session';
import { allApiDocs } from '#transport/core/openapi/api_docs_registry';
import { buildOpenApiSpec, type ApiRouteSummary, type SecurityScheme } from '#transport/core/openapi/openapi_generator';
import { paginationValidator } from '#transport/core/validators/pagination';
import type { HttpContext } from '@adonisjs/core/http';

/**
 * Security schemes declared in the generated spec. Where the session guard
 * is enabled, admin routes document both schemes as alternatives: external
 * clients authenticate with an opaque API bearer token, in-repo clients with
 * the session cookie. Flavors without the web guard declare `apiToken` only,
 * and the generator's default security follows the declared schemes.
 */
const securitySchemes: Record<string, SecurityScheme> = {
	apiToken: {
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'opaque',
		description: 'Opaque API access token, sent as a bearer token (API guard).',
	},
	...(enabledAuthGuards.web && {
		session: {
			type: 'apiKey',
			in: 'cookie',
			name: sessionCookieName,
			description: `Session cookie (${sessionCookieName}), set after login (web guard).`,
		},
	}),
};

/** The `info` block identifying the documented API. */
const info = {
	title: 'AdonisJS Foundry API',
	version: 'v1',
	description:
		'Versioned REST API of the Foundry surface: auth, account, identity (users, roles, permissions), dashboard, maintenance, files, folders, logs, and the CMS (pages, templates, builder).',
};

/**
 * GET /api/v1/openapi.json — the OpenAPI document, generated on request from
 * the live route registry and the docs registered by each transport module.
 *
 * The spec is scoped to the requesting user: the route is guarded like the
 * admin API, and every documented route is filtered through the `permission`
 * middleware it declares, so a user only sees the endpoints their role can
 * call (the same `checkAny` semantics the API enforces at dispatch time). The
 * interactive reference UI over this document lives on the front (`/api/docs`,
 * see `controllers/front/docs_controller.ts`), not here: it is a self-hosted
 * Vite/Edge page, not a view of the generated data.
 */
@inject()
export default class OpenApiController {
	/**
	 * The permission slugs a route declares through its named `permission`
	 * middleware. Both group-level and route-level middleware end up in the
	 * route's committed stack — the router flattens group middleware into
	 * every route of the group — so reading the route alone is sufficient.
	 *
	 * The registry normally carries the framework's frozen `Middleware`
	 * instance (exposing `all()`), but entries pushed directly onto the route
	 * table (e.g. test probes) may carry a plain array or nothing at all, so
	 * every shape is tolerated.
	 *
	 * @param middleware - The committed middleware stack of one registered route.
	 * @returns The declared permission slugs, empty when the route requires none.
	 */
	private requiredPermissionsOf(
		middleware: { all(): Iterable<unknown> } | Iterable<unknown> | null | undefined,
	): string[] {
		const slugs: string[] = [];

		const entries =
			middleware === null || middleware === undefined
				? []
				: typeof (middleware as { all?: unknown }).all === 'function'
					? (middleware as { all(): Iterable<unknown> }).all()
					: (middleware as Iterable<unknown>);

		for (const entry of entries) {
			if (typeof entry !== 'object' || entry === null) {
				continue;
			}

			const named = entry as { name?: unknown; args?: unknown };
			if (named.name !== 'permission') {
				continue;
			}

			const declared = (named.args as { permissions?: unknown } | null | undefined)?.permissions;
			if (!Array.isArray(declared)) {
				continue;
			}

			for (const slug of declared) {
				if (typeof slug === 'string') {
					slugs.push(slug);
				}
			}
		}

		return slugs;
	}

	/**
	 * Flatten the framework's route registry into the plain route summaries
	 * the generator consumes — one summary per (route, method) pair — and
	 * narrow the set to the routes the user may access: routes without a
	 * permission requirement are visible to any authenticated user, protected
	 * routes require one of their declared slugs.
	 *
	 * @param user - The authenticated user the spec is scoped to.
	 * @returns The route summaries the user's spec may contain.
	 */
	private async collectRoutes(user: NonNullable<HttpContext['auth']['user']>): Promise<ApiRouteSummary[]> {
		const visible: ApiRouteSummary[] = [];

		for (const route of Object.values(router.toJSON()).flat()) {
			const requiredPermissions = this.requiredPermissionsOf(route.middleware);
			if (requiredPermissions.length > 0 && !(await user.checkAny(requiredPermissions))) {
				continue;
			}

			for (const method of route.methods) {
				visible.push({ name: route.name, pattern: route.pattern, method });
			}
		}

		return visible;
	}

	/** GET /api/v1/openapi.json — the generated OpenAPI 3.0 document. */
	async spec(ctx: HttpContext) {
		const user = ctx.auth.user;

		if (!user) {
			throw new UnauthorizedException();
		}

		return buildOpenApiSpec({
			routes: await this.collectRoutes(user),
			docs: allApiDocs(),
			info,
			securitySchemes,
			pagination: paginationValidator,
		});
	}
}
