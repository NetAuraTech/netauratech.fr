import { test } from '@japa/runner';
import legalConfig from '#config/legal';
import { parseInertiaPage } from '#tests/helpers/inertia_page';

/**
 * Functional tests for the public legal pages.
 *
 * The pages render the publisher identity resolved from the `LEGAL_*`
 * environment variables (see `config/legal.ts`), which falls back to the
 * `<CHANGEME>` placeholder when a value is unset. Because the test boot also
 * reads the local `.env`, these tests assert the route, the SSR payload and
 * the controller → page wiring: the rendered props must match the config the
 * server resolved at boot, whatever that config is.
 */
test.group('Legal pages', () => {
	test('legal notices renders the configured publisher identity', async ({ client, assert }) => {
		const res = await client.get('/mentions-legales');
		res.assertStatus(200);

		const identity = parseInertiaPage(res.text()).props.identity;
		assert.equal(identity.name, legalConfig.identity.name);
		assert.equal(identity.status, legalConfig.identity.status);
		assert.equal(identity.address, legalConfig.identity.address);
		assert.equal(identity.siret, legalConfig.identity.siret);
		assert.equal(identity.publicationDirector, legalConfig.identity.publicationDirector);
	});

	test('privacy policy renders the configured identity and revision date', async ({ client, assert }) => {
		const res = await client.get('/politique-de-confidentialite');
		res.assertStatus(200);

		const props = parseInertiaPage(res.text()).props;
		assert.equal(props.identity.name, legalConfig.identity.name);
		assert.equal(props.identity.status, legalConfig.identity.status);
		assert.equal(props.identity.address, legalConfig.identity.address);
		assert.equal(props.identity.siret, legalConfig.identity.siret);
		assert.equal(props.identity.publicationDirector, legalConfig.identity.publicationDirector);
		assert.equal(props.privacyUpdatedAt, legalConfig.privacyUpdatedAt);
	});
});
