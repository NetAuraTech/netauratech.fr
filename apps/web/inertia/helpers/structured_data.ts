import type { LegalIdentity } from '#types/legal';

/**
 * The structured-data builders of the public front.
 *
 * Pure functions producing `schema.org` JSON-LD nodes for the document head.
 * They stay in the Inertia layer (no backend imports) and take plain values —
 * the page shared props and the content payload — so each front page composes
 * its own head without any further data access.
 */

/** A JSON-LD node ready to be serialized into a `application/ld+json` script. */
export type JsonLd = Record<string, unknown>;

/**
 * The structural subset of a service offer consumed by the structured-data
 * builders, kept independent of the full content payload type.
 */
export type ServiceOffer = {
	/** Service name, e.g. `'Sites vitrines'`. */
	rubrique: string;
	/** Discrete items describing the service. */
	items: string[];
	/** The trailing `**Tarif**` fact line, when present. */
	tarif?: string;
};

/**
 * The structural subset of a project entry consumed by the structured-data
 * builders (its `slug` and display fields only).
 */
export type ProjectEntry = {
	/** Content slug, used for the `/projets/{slug}` URL. */
	slug: string;
	/** Project title. */
	title: string;
};

/**
 * The publisher-identity placeholder rendered by `config/legal.ts` when a
 * `LEGAL_*` env value is unset. Mirrored here because the Inertia layer may
 * not import backend modules.
 */
const PLACEHOLDER = '<CHANGEME>';

/**
 * Whether a value is still an unset placeholder (empty or the `<CHANGEME>`
 * sentinel), so it must not leak into public structured data.
 *
 * @param value - The value to check.
 */
function isPlaceholder(value: string | undefined): boolean {
	return value === undefined || value.trim() === '' || value === PLACEHOLDER;
}

/**
 * Parse a free-form French address (e.g. `"47 rue X, 62830, Samer, France"`)
 * into a `schema.org` `PostalAddress`, taking whatever parts are present.
 *
 * The country, the 5-digit postal code and the locality are recognised
 * positionally; everything left over becomes the `streetAddress`.
 *
 * @param address - The comma-separated address line.
 * @returns A `PostalAddress` node, or `undefined` when the address is a
 * placeholder.
 */
export function parsePostalAddress(address: string | undefined): JsonLd | undefined {
	if (typeof address !== 'string' || isPlaceholder(address)) return undefined;

	const parts = address
		.split(',')
		.map((part) => part.trim())
		.filter((part) => part !== '');
	if (parts.length === 0) return undefined;

	const postalIndex = parts.findIndex((part) => /^\d{5}$/.test(part));
	const country = parts.length >= 2 ? parts[parts.length - 1] : undefined;
	const locality = parts.length >= 3 ? parts[parts.length - 2] : undefined;

	const consumed = new Set<number>();
	if (country !== undefined) consumed.add(parts.length - 1);
	if (locality !== undefined) consumed.add(parts.length - 2);
	if (postalIndex !== -1) consumed.add(postalIndex);

	const streetAddress = parts
		.filter((_, index) => !consumed.has(index))
		.join(', ')
		.trim();

	const node: JsonLd = { '@type': 'PostalAddress' };
	if (streetAddress) node.streetAddress = streetAddress;
	if (postalIndex !== -1) node.postalCode = parts[postalIndex];
	if (locality && locality !== country) node.addressLocality = locality;
	if (country && country !== locality) {
		node.addressCountry = /france/i.test(country) ? 'FR' : country;
	}

	return node;
}

/**
 * Build the `ProfessionalService` (a `LocalBusiness` subtype) JSON-LD node
 * describing the studio.
 *
 * Identity values that are still unset placeholders are omitted, so a
 * not-yet-configured deployment never leaks the `<CHANGEME>` sentinel into
 * structured data. The email is omitted when it is a reserved example
 * address. The `hasOfferCatalog` is only attached when the page carries the
 * service catalogue.
 *
 * @param opts.appUrl - Absolute application URL (no trailing slash).
 * @param opts.appName - Public site name.
 * @param opts.email - Contact email shared with every page.
 * @param opts.identity - Publisher identity resolved from the `LEGAL_*` env.
 * @param opts.services - The service catalogue, when available on the page.
 * @returns The `ProfessionalService` node.
 *
 * @example
 * const jsonLd = businessJsonLd({ appUrl, app_name, email, legal_identity })
 */
export function businessJsonLd(opts: {
	appUrl: string;
	appName: string;
	email?: string;
	identity: LegalIdentity;
	services?: ServiceOffer[];
}): JsonLd {
	const { appUrl, appName, email, identity, services } = opts;

	const node: JsonLd = {
		'@context': 'https://schema.org',
		'@type': 'ProfessionalService',
		'@id': `${appUrl}/#business`,
		name: appName,
		url: appUrl,
		logo: `${appUrl}/web-app-manifest-512x512.png`,
		image: `${appUrl}/web-app-manifest-512x512.png`,
		description:
			'Studio de développement web sur mesure : sites vitrines, boutiques en ligne et applications web, code 100 % sur mesure, SEO et performance, accompagnement continu.',
		areaServed: ['Hauts-de-France', 'France'],
	};

	if (!isPlaceholder(identity.name)) node.legalName = identity.name;
	if (email && !/example\.com$/i.test(email)) node.email = email;

	const address = parsePostalAddress(identity.address);
	if (address) node.address = address;
	if (!isPlaceholder(identity.siret) && /^\d{14}$/.test(identity.siret)) node.taxID = identity.siret;

	if (services && services.length > 0) {
		node.hasOfferCatalog = {
			'@type': 'OfferCatalog',
			name: 'Prestations de développement web',
			item: services.map((service) => ({
				'@type': 'Offer',
				itemOffered: {
					'@type': 'Service',
					name: service.rubrique,
					serviceType: service.rubrique,
					description: service.items.join(', '),
					provider: { '@id': `${appUrl}/#business` },
				},
				...(service.tarif ? { description: `Tarif : ${service.tarif}` } : {}),
			})),
		};
	}

	return node;
}

/**
 * Build the `ItemList` JSON-LD node for the project portfolio listing.
 *
 * @param appUrl - Absolute application URL (no trailing slash).
 * @param appName - Public site name.
 * @param projects - The ordered project catalogue.
 * @returns The `ItemList` node with one `ListItem` per project.
 */
export function projectItemListJsonLd(appUrl: string, appName: string, projects: ProjectEntry[]): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: `Projets — ${appName}`,
		itemListOrder: 'https://schema.org/ItemListUnordered',
		numberOfItems: projects.length,
		itemListElement: projects.map((project, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: project.title,
			url: `${appUrl}/projets/${project.slug}`,
		})),
	};
}

/**
 * Build the `BreadcrumbList` JSON-LD node for a page trail.
 *
 * The current page (the last crumb) is expected without `url`: it is listed
 * by name only, per the schema.org breadcrumb guidance.
 *
 * @param trail - The ordered crumbs, from the site root down.
 * @returns The `BreadcrumbList` node.
 *
 * @example
 * breadcrumbJsonLd([{ name: 'Accueil', url: `${appUrl}/` }, { name: 'Projets', url: `${appUrl}/projets` }, { name: project.title }])
 */
export function breadcrumbJsonLd(trail: { name: string; url?: string }[]): JsonLd {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((crumb, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: crumb.name,
			...(crumb.url ? { item: crumb.url } : {}),
		})),
	};
}
