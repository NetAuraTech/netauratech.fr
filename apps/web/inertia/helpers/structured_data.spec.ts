import { describe, expect, it } from 'vitest';
import { breadcrumbJsonLd, businessJsonLd, parsePostalAddress, projectItemListJsonLd } from '~/helpers/structured_data';
import type { LegalIdentity } from '#types/legal';

/**
 * SEO contract for the structured-data builders: the JSON-LD emitted in the
 * public front heads must carry the studio identity (ProfessionalService),
 * the portfolio ItemList and the breadcrumb trail — and must never leak the
 * `<CHANGEME>` placeholder of an unconfigured deployment.
 */

/** Synthetic identity fixture — never the real publisher data (that lives in env). */
const configuredIdentity: LegalIdentity = {
	name: 'Jeanne Dupont',
	status: 'Auto-entrepreneur',
	address: '8 avenue des Tilleuls, 75011, Paris, France',
	siret: '12345678901234',
	publicationDirector: 'Jeanne Dupont',
};

const placeholderIdentity: LegalIdentity = {
	name: '<CHANGEME>',
	status: '<CHANGEME>',
	address: '<CHANGEME>',
	siret: '<CHANGEME>',
	publicationDirector: '<CHANGEME>',
};

const appUrl = 'https://netauratech.fr';

describe('parsePostalAddress', () => {
	it('parses the full French address into a PostalAddress', () => {
		expect(parsePostalAddress(configuredIdentity.address)).toEqual({
			'@type': 'PostalAddress',
			streetAddress: '8 avenue des Tilleuls',
			postalCode: '75011',
			addressLocality: 'Paris',
			addressCountry: 'FR',
		});
	});

	it('returns undefined for the placeholder', () => {
		expect(parsePostalAddress('<CHANGEME>')).toBeUndefined();
	});

	it('returns undefined for an empty address', () => {
		expect(parsePostalAddress('')).toBeUndefined();
	});

	it('keeps the street only when no structured parts are present', () => {
		expect(parsePostalAddress('12 rue des Lilas')).toEqual({
			'@type': 'PostalAddress',
			streetAddress: '12 rue des Lilas',
		});
	});
});

describe('businessJsonLd', () => {
	it('emits the ProfessionalService node with the configured identity', () => {
		const node = businessJsonLd({
			appUrl,
			appName: 'NetAuraTech',
			email: 'contact@netauratech.fr',
			identity: configuredIdentity,
		});

		expect(node['@type']).toBe('ProfessionalService');
		expect(node['@id']).toBe(`${appUrl}/#business`);
		expect(node.name).toBe('NetAuraTech');
		expect(node.url).toBe(appUrl);
		expect(node.logo).toBe(`${appUrl}/web-app-manifest-512x512.png`);
		expect(node.image).toBe(`${appUrl}/web-app-manifest-512x512.png`);
		expect(node.legalName).toBe('Jeanne Dupont');
		expect(node.email).toBe('contact@netauratech.fr');
		expect(node.taxID).toBe('12345678901234');
		expect(node.address).toEqual({
			'@type': 'PostalAddress',
			streetAddress: '8 avenue des Tilleuls',
			postalCode: '75011',
			addressLocality: 'Paris',
			addressCountry: 'FR',
		});
		expect(node.areaServed).toEqual(['Hauts-de-France', 'France']);
	});

	it('omits every placeholder value for an unconfigured deployment', () => {
		const node = businessJsonLd({
			appUrl,
			appName: 'NetAuraTech',
			email: 'contact@example.com',
			identity: placeholderIdentity,
		});

		expect(node.legalName).toBeUndefined();
		expect(node.email).toBeUndefined();
		expect(node.address).toBeUndefined();
		expect(node.taxID).toBeUndefined();
		expect(JSON.stringify(node)).not.toContain('<CHANGEME>');
	});

	it('attaches the offer catalog only when services are provided', () => {
		const without = businessJsonLd({ appUrl, appName: 'NetAuraTech', identity: configuredIdentity });
		expect(without.hasOfferCatalog).toBeUndefined();

		const withCatalog = businessJsonLd({
			appUrl,
			appName: 'NetAuraTech',
			identity: configuredIdentity,
			services: [
				{
					rubrique: 'Sites vitrines',
					items: ['Design sur mesure', 'SEO & performance'],
					tarif: 'à partir de 1 000 € HT',
				},
			],
		});

		const catalog = withCatalog.hasOfferCatalog as Record<string, any>;
		expect(catalog['@type']).toBe('OfferCatalog');
		expect(catalog.item).toHaveLength(1);
		expect(catalog.item[0].itemOffered.name).toBe('Sites vitrines');
		expect(catalog.item[0].itemOffered.provider['@id']).toBe(`${appUrl}/#business`);
		expect(catalog.item[0].description).toBe('Tarif : à partir de 1 000 € HT');
	});
});

describe('projectItemListJsonLd', () => {
	it('emits one ListItem per project with its absolute URL', () => {
		const node = projectItemListJsonLd(appUrl, 'NetAuraTech', [
			{ slug: 'floralia-atelier', title: 'Floralia Atelier' },
			{ slug: 'adonisjs-foundry', title: 'AdonisJS Foundry' },
		]);

		expect(node['@type']).toBe('ItemList');
		expect(node.numberOfItems).toBe(2);
		expect(node.itemListElement).toEqual([
			{ '@type': 'ListItem', position: 1, name: 'Floralia Atelier', url: `${appUrl}/projets/floralia-atelier` },
			{ '@type': 'ListItem', position: 2, name: 'AdonisJS Foundry', url: `${appUrl}/projets/adonisjs-foundry` },
		]);
	});
});

describe('breadcrumbJsonLd', () => {
	it('emits the trail with the current page by name only', () => {
		const node = breadcrumbJsonLd([
			{ name: 'Accueil', url: `${appUrl}/` },
			{ name: 'Projets', url: `${appUrl}/projets` },
			{ name: 'Floralia Atelier' },
		]);

		expect(node['@type']).toBe('BreadcrumbList');
		expect(node.itemListElement).toEqual([
			{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${appUrl}/` },
			{ '@type': 'ListItem', position: 2, name: 'Projets', item: `${appUrl}/projets` },
			{ '@type': 'ListItem', position: 3, name: 'Floralia Atelier' },
		]);
	});
});
