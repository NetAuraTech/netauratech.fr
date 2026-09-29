import { registry } from '@generated/registry';
import { createTuyau } from '@tuyau/core/client';

export const client = createTuyau({
	baseUrl: '/',
	registry,
});

export const urlFor = client.urlFor;

/**
 * The HTTP methods an Inertia form may submit with (lower-cased, as the
 * Inertia `Form` `action` pair expects).
 */
export type InertiaMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * Resolves an Inertia form `action` as a `{ url, method }` pair.
 *
 * A bare `urlFor()` string makes Inertia's `<Form>` fall back to its default
 * method (`get`), which moves the field values into the query string and
 * hands `onBefore` an empty `data` record, so every required check fails
 * even though the fields are filled. Resolving the route's own method from
 * the registry (exactly what the old typed `route=` prop did) keeps the
 * values in the request body.
 *
 * @param name - The registered route name.
 * @param params - Route params, same shape as `urlFor`.
 * @returns The `action` pair to pass to an Inertia `<Form>`.
 */
export function actionFor(
	name: Parameters<typeof client.getRoute>[0],
	params?: Record<string, any>,
): { url: string; method: InertiaMethod } {
	const { url, methods } = client.getRoute(name, { params } as Parameters<typeof client.getRoute>[1]);
	return { url, method: methods[0].toLowerCase() as InertiaMethod };
}
