import { test } from '@japa/runner';
import { allApiDocs, getApiDoc, registerApiDoc, type NamedRoute } from '#transport/core/openapi/api_docs_registry';

/** A minimal stand-in for a registered route: the registry only reads its name. */
function namedRoute(name: string): NamedRoute {
	return { getName: () => name };
}

test.group('Api docs registry', () => {
	test('returns undefined for an unregistered route name', ({ assert }) => {
		assert.isUndefined(getApiDoc('api.v1.registry.probe.missing'));
	});

	test('registers a doc and retrieves it by the route name', ({ assert }) => {
		const doc = { summary: 'List users', tags: ['Users'] as const };

		registerApiDoc(namedRoute('api.v1.registry.probe.users.index'), doc);

		assert.strictEqual(getApiDoc('api.v1.registry.probe.users.index'), doc);
	});

	test('overwrites the doc of an already registered route', ({ assert }) => {
		const route = namedRoute('api.v1.registry.probe.users.index');

		registerApiDoc(route, { summary: 'First' });
		registerApiDoc(route, { summary: 'Second' });

		assert.equal(getApiDoc('api.v1.registry.probe.users.index')!.summary, 'Second');
	});

	test('derives the route name at read time, not at registration time', ({ assert }) => {
		// Group prefixes are composed onto a route after its registration
		// (the group chain closes later), so the registry must resolve the
		// final name when it is read.
		let name = 'api.v1.registry.probe.partial';
		const route: NamedRoute = { getName: () => name };

		registerApiDoc(route, { summary: 'A' });
		name = 'api.v1.registry.probe.composed';

		assert.isUndefined(getApiDoc('api.v1.registry.probe.partial'));
		assert.exists(getApiDoc('api.v1.registry.probe.composed'));
	});

	test('exposes every registered doc keyed by route name', ({ assert }) => {
		registerApiDoc(namedRoute('api.v1.registry.probe.a'), { summary: 'A' });
		registerApiDoc(namedRoute('api.v1.registry.probe.b'), { summary: 'B' });

		const all = allApiDocs();

		assert.exists(all.get('api.v1.registry.probe.a'));
		assert.exists(all.get('api.v1.registry.probe.b'));
	});

	test('returns the route from registerApiDoc so the declaration chain continues', ({ assert }) => {
		const route = namedRoute('api.v1.registry.probe.chain');

		assert.strictEqual(registerApiDoc(route, { summary: 'A' }), route);
	});
});
