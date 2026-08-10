/**
 * Filter and shape router routes for Inertia page payloads.
 *
 * @param allRoutes - Raw route entries from `router.toJSON().root`
 * @param method - HTTP method to keep (`'GET' | 'POST'`, …)
 * @param exclusions - Prefixes / exact names to exclude
 *
 * @returns Array of `{ name, pattern, params }` suitable for the frontend
 */
export function filterRoutes(
  allRoutes: { methods: string[]; name?: string; pattern: string }[],
  method: string,
  exclusions: string[] = []
): { name: string; pattern: string; params: string[] }[] {
  const filtered = allRoutes.filter((r): r is typeof r & { name: string } => {
    if (!r.methods.includes(method)) return false
    if (!r.name) return false

    const name = r.name
    const isExcluded = exclusions.some((ex) => name.startsWith(ex))
    return !isExcluded
  })

  return filtered.map((r) => ({
    name: r.name,
    pattern: r.pattern,
    params: r.pattern.match(/:(\w+)/g)?.map((p) => p.replace(':', '')) ?? [],
  }))
}
