import type { I18nTranslator } from '#core/contracts/i18n_translator';
import type { DashboardCollector, DashboardStats } from '#core/types/dashboard';

/**
 * Lazily resolves a dashboard collector instance — typically through the IoC
 * container, so collectors keep their constructor injection.
 */
export type DashboardCollectorFactory<K extends keyof DashboardStats = keyof DashboardStats> = () => Promise<
	DashboardCollector<K>
>;

/**
 * Builds a translation fragment for the dashboard payload from the
 * request-scoped i18n service.
 */
export type DashboardTranslationBuilder = (i18n: I18nTranslator) => Record<string, unknown>;

/**
 * Registry of dashboard section collectors and translation fragments.
 *
 * Populated once at startup by the composition module (`start/dashboard.ts`),
 * which is the only place knowing which domains exist in this flavor of the
 * application. `GetDashboardStatsAction` reads the collector factories to
 * aggregate the dashboard payload without knowing the contributing domains,
 * and `DashboardController` reads the translation builders to merge the
 * per-domain i18n fragments into the full translation payload.
 */
export class DashboardRegistry {
	private factories = new Map<keyof DashboardStats, DashboardCollectorFactory>();
	private translationBuilders: DashboardTranslationBuilder[] = [];

	/**
	 * Register the collector factory for a dashboard section. Registering the
	 * same section twice replaces the previous factory.
	 *
	 * @param section - Payload key the collector contributes to.
	 * @param factory - Resolver returning the collector instance.
	 *
	 * @example
	 * registry.register('page', () => app.container.make(PageDashboardCollector))
	 */
	register<K extends keyof DashboardStats>(section: K, factory: DashboardCollectorFactory<K>): void {
		this.factories.set(section, factory as DashboardCollectorFactory);
	}

	/**
	 * List the registered sections and their collector factories, in
	 * registration order.
	 */
	entries(): [keyof DashboardStats, DashboardCollectorFactory][] {
		return [...this.factories.entries()];
	}

	/**
	 * Register a translation builder that produces a fragment of the dashboard
	 * translation payload for the request-scoped locale.
	 *
	 * @param builder - Function returning a resolved translation fragment.
	 *
	 * @example
	 * registry.registerTranslations(buildCmsDashboardPayload)
	 */
	registerTranslations(builder: DashboardTranslationBuilder): void {
		this.translationBuilders.push(builder);
	}

	/**
	 * List the registered translation builders, in registration order.
	 */
	getTranslationBuilders(): DashboardTranslationBuilder[] {
		return this.translationBuilders;
	}
}
