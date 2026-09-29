import type { Inertia } from '@adonisjs/inertia';
import type { AsPageProps, ComponentProps, InertiaPages, PageObject, SharedProps } from '@adonisjs/inertia/types';

/**
 * The props a render site may pass for a given page name.
 *
 * For pages whose component props conform to {@link ComponentProps}, this is
 * the framework's own {@link AsPageProps} mapping (with the globally shared
 * props omitted), so the call site keeps full per-page prop type safety.
 * For pages carrying rich, non-JSON prop types (resolved CMS content, file
 * metadata, ...) the framework types `inertia.render`'s props parameter as
 * `never`; those pages fall back to a plain record so they stay renderable.
 */
export type RenderPageProps<Page extends string> = Page extends keyof InertiaPages
	? InertiaPages[Page] extends ComponentProps
		? AsPageProps<Omit<InertiaPages[Page], keyof SharedProps>>
		: Record<string, unknown>
	: Record<string, unknown>;

/**
 * The response a {@link renderInertiaPage} call resolves to for a page name:
 * the Inertia page object for client visits, or the rendered HTML string for
 * initial page loads.
 */
export type RenderPageResult<Page extends string> = Page extends keyof InertiaPages
	? string | PageObject<InertiaPages[Page], Page>
	: string | PageObject<Record<string, unknown>, Page>;

/**
 * Render an Inertia page through the app's single shared, typed entry point.
 *
 * `Inertia#render` types its props parameter as `never` for pages whose
 * component props don't conform to {@link ComponentProps}, which previously
 * forced an `as any` cast at every such render site. The cast now lives
 * exactly here: every render site (controllers, the page adapter) calls this
 * helper instead of `ctx.inertia.render` directly.
 *
 * Literal page names stay type-checked against the discovered `InertiaPages`
 * map, per-page props keep their full type for conforming pages, and a plain
 * `string` page name is accepted for dynamic renders (the page adapter's
 * declarative `component` field).
 *
 * @param inertia - The request's Inertia instance (`ctx.inertia`).
 * @param page - The discovered page name, or a dynamic component name.
 * @param props - The page props, typed per page where the page conforms.
 * @returns The Inertia response for the page.
 *
 * @example
 * return renderInertiaPage(ctx.inertia, 'role/admin/index', {
 * 	roles: RoleTransformer.transform(roles),
 * });
 */
export function renderInertiaPage<Page extends string>(
	inertia: Inertia<InertiaPages>,
	page: Page,
	props: RenderPageProps<Page>,
): Promise<RenderPageResult<Page>> {
	// The single centralized cast of `Inertia#render` in the app tree: its
	// generic props parameter is `never` for non-conforming pages, so the
	// call goes through a permissive signature here and nowhere else. The
	// cast stays on the member expression itself — `Inertia#render` reads
	// `this`, so extracting it into a local would detach the receiver.
	return (
		inertia.render as unknown as (page: string, props: Record<string, unknown>) => Promise<RenderPageResult<Page>>
	)(page, props as Record<string, unknown>);
}
