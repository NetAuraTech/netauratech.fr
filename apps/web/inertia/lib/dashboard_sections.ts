import type { AdminDashboardTranslations } from '#transport/core/helpers/i18n_payloads/dashboard';
import type { Data } from '@generated/data';
import type { ComponentType } from 'react';

/**
 * Client-side registry of admin dashboard section cards, mirroring the
 * server-side `DashboardRegistry` (`start/dashboard.ts`).
 *
 * Each domain registers the React card(s) rendering its dashboard section,
 * keyed by the section name it contributes to the `stats` payload. The admin
 * dashboard page (`inertia/pages/core/admin/dashboard.tsx`) renders exactly
 * the sections present in the payload, looked up in this registry — so a
 * flavor pruned of a domain simply has no card registered for that key and
 * nothing renders.
 *
 * Registration happens at module load: core sections (`identity`, `file`) register
 * from `inertia/components/dashboard_sections/`, the CMS sections (`page`,
 * `template`) from `inertia/components/cms/dashboard_sections/`. The page
 * eagerly imports every card module via a glob, so on a pruned flavor only the
 * core cards are imported and registered.
 */

/** Props handed to every dashboard section card. */
export interface DashboardSectionCardProps {
	/** The full aggregated stats payload — cards read their own section(s). */
	stats: Data.Core.Dashboard;
	/** Dashboard translations resolved for the request locale. */
	translations: AdminDashboardTranslations;
	/** Format a date for the active locale; '—' for null. */
	formatDate: (value: string | null) => string;
}

/** A React component rendering one dashboard section. */
export type DashboardSectionCard = ComponentType<DashboardSectionCardProps>;

/** The cards rendering a section: its headline card and optional recent-activity card. */
export interface DashboardSectionCardBundle {
	/** Headline card shown in the stats grid. */
	Stat: DashboardSectionCard;
	/** Recent-activity card shown in the activity grid. Omit when the section has no activity list. */
	Recent?: DashboardSectionCard;
}

const registry = new Map<string, DashboardSectionCardBundle>();

/**
 * Register the cards for a dashboard section.
 *
 * Called once at module load by each section's card module. Registering the
 * same section twice replaces the previous bundle.
 *
 * @param key - Payload key the cards render (e.g. `'identity'`, `'file'`, `'page'`).
 * @param bundle - The headline (and optional recent-activity) card components.
 */
export function registerDashboardSection(key: string, bundle: DashboardSectionCardBundle): void {
	registry.set(key, bundle);
}

/**
 * Resolve the cards registered for a dashboard section.
 *
 * @param key - Section payload key to look up.
 * @returns The registered bundle, or `undefined` when no card is registered
 * for that section (e.g. a pruned domain).
 */
export function getDashboardSectionBundle(key: string): DashboardSectionCardBundle | undefined {
	return registry.get(key);
}
