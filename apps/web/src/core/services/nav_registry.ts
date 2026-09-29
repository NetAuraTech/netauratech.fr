import type { AdminNavEntry } from '#core/types/nav';

/**
 * Registry of admin navigation entries.
 *
 * Populated once at startup by the composition module (`start/nav.ts`),
 * which is the only place knowing which domains exist in this flavor of the
 * application. The inertia middleware reads it to compose the shared
 * `admin_menu` prop without knowing the contributing domains — dropping a
 * domain from the composition therefore removes its entries from the admin
 * sidebar without touching kept code.
 */
export class NavRegistry {
	private domains = new Map<string, AdminNavEntry[]>();

	/**
	 * Register the navigation entries of a domain. Registering the same
	 * domain twice replaces its previous entries.
	 *
	 * @param domain - Domain identifier (used as the replacement key only).
	 * @param entries - Entries contributed by the domain, in sidebar order.
	 *
	 * @example
	 * registry.register('identity', identityNavEntries)
	 */
	register(domain: string, entries: AdminNavEntry[]): void {
		this.domains.set(domain, entries);
	}

	/**
	 * List the registered domains and their entries, in registration order.
	 */
	entries(): [string, AdminNavEntry[]][] {
		return [...this.domains.entries()];
	}
}
