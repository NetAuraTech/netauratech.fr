/**
 * Declarative admin navigation entry contributed by a domain.
 *
 * Entries are registered once at boot (see `start/nav.ts`) into the
 * `NavRegistry` singleton and turned into request-scoped, label-resolved
 * groups by the inertia middleware. Labels stay as i18n keys here because
 * the resolution locale is only known per request.
 */
export type AdminNavEntry = {
  /** i18n key resolved per request (e.g. `admin.users.value`, `page.admin.value`). */
  label: string
  /** Icon name resolved by the `Icon` atom; entries without an icon render text-only. */
  icon?: string
  /** Named route the entry links to (tuyau route name, e.g. `admin.users.render`). */
  route: string
  /** Optional route parameters forwarded to `urlFor`. */
  routeParams?: Record<string, string | number>
  /** Permission slug(s) gating the entry (client-side hint; the route stays guarded server-side). */
  permission: string | string[]
  /**
   * Sidebar category the entry belongs to. `no_category` renders without a
   * heading (used for the dashboard link).
   */
  category: 'no_category' | 'content' | 'access_control' | 'settings'
}

/** An {@link AdminNavEntry} with its label resolved for the current request locale. */
export type ResolvedAdminNavEntry = {
  label: string
  icon?: string
  route: string
  routeParams?: Record<string, string | number>
  permission: string | string[]
}

/**
 * A sidebar category with its resolved entries, shared by the inertia
 * middleware as `admin_menu`. `label` is `null` for the `no_category` group
 * so the sidebar renders those entries without a heading.
 */
export type AdminNavGroup = {
  category: string
  label: string | null
  entries: ResolvedAdminNavEntry[]
}
