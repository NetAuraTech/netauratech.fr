import { renderInertiaPage } from '#transport/core/helpers/inertia_render';
import { resolveEndpoint, type AdapterHandler } from '#transport/core/rest/rest_adapter';

/**
 * Run a declarative endpoint as an admin page and send the page response.
 *
 * The page transport of the REST resource contract: the shared request
 * interpretation is resolved through {@link resolveEndpoint} exactly once,
 * then the endpoint's `page` declaration produces the page transport output:
 *
 * - display methods (GET/HEAD): the Inertia page rendered with the props
 *   built by `cms.page.render`
 * - mutating methods: the success flash from `page.flash`, then a redirect
 *   to the named route from `page.redirect`
 *
 * A validation failure never reaches the page declaration: the exception
 * propagates to the global Vine handler, which flashes the errors and
 * redirects back so the page re-renders with its validation state. Domain
 * exceptions thrown by the action propagate the same way and are shaped by
 * the standard exception handler.
 *
 * @param ctx - The AdonisJS HTTP context.
 * @param endpoint - The endpoint carrying its `page` declaration.
 * @returns Resolves once the page response has been sent.
 *
 * @example
 * async render(ctx: HttpContext) {
 *   return handle(ctx, this.usersResource.endpoints.index)
 * }
 */
export const handle: AdapterHandler = async (ctx, endpoint) => {
	const page = endpoint.page;

	if (!page) {
		throw new Error('[page_adapter] the endpoint is missing its page declaration');
	}

	const { context, prepared, payload, result } = await resolveEndpoint(ctx, endpoint);

	if (ctx.request.method() === 'GET' || ctx.request.method() === 'HEAD') {
		const { component, render } = page;

		if (!component || !render) {
			throw new Error('[page_adapter] the endpoint is missing its page render declaration');
		}

		// The component name stays a plain `string` on the contract, so the
		// dynamic render goes through the shared Inertia render helper.
		return renderInertiaPage(ctx.inertia, component, await render(context, prepared, payload, result));
	}

	const { flash, redirect } = page;

	if (!flash || !redirect) {
		throw new Error('[page_adapter] the endpoint is missing its page flash and redirect declarations');
	}

	ctx.session.flash('success', await flash(context, prepared, payload, result));

	const { route, params } = redirect(context, prepared, payload, result);

	// The route name stays a plain `string` on the contract, so the dynamic
	// redirect goes through a cast rather than the generated route names.
	return (ctx.response.redirect().toRoute as (routeName: string, params?: Record<string, unknown>) => void)(
		route,
		params ?? {},
	);
};
