import router from '@adonisjs/core/services/router'

/**
 * Resolve a route URL path by name against the *runtime* route table.
 *
 * The Tuyau-generated URL builder types route-name literals against the
 * current route list, so kept code may only reference routes that exist in
 * the flavor being type-checked. Mail links need a target in every flavor —
 * the headless `api` flavor links to the token API endpoints instead of the
 * session pages — so the name is passed as a plain string, existence is
 * checked with `router.has`, and the URL is built through the string-based
 * builder that accepts any registered identifier.
 *
 * @param name - Named route identifier (route name, controller.method or pattern).
 * @param params - Route pattern params (e.g. `{ token }`).
 * @returns The resolved path, or `null` when the route is not registered.
 */
export function routePath(
  name: string,
  params: Record<string, string | number> = {}
): string | null {
  if (!router.has(name)) return null
  return router.builder().params(params).make(name)
}
