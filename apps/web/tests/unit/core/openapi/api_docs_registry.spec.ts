import { test } from '@japa/runner';
import { clearApiDocs, allApiDocs, getApiDoc, registerApiDoc } from '#transport/core/openapi/api_docs_registry';

test.group('Api docs registry', (group) => {
	group.each.setup(clearApiDocs);

	test('returns undefined for an unregistered route', ({ assert }) => {
		assert.isUndefined(getApiDoc('api.v1.admin.identity.users.index'));
	});

	test('registers and retrieves a doc by route name', ({ assert }) => {
		const doc = { summary: 'List users', tags: ['Users'] as const };

		registerApiDoc('api.v1.admin.identity.users.index', doc);

		assert.strictEqual(getApiDoc('api.v1.admin.identity.users.index'), doc);
	});

	test('overwrites the doc of an already registered route', ({ assert }) => {
		registerApiDoc('api.v1.admin.identity.users.index', { summary: 'First' });
		registerApiDoc('api.v1.admin.identity.users.index', { summary: 'Second' });

		assert.equal(getApiDoc('api.v1.admin.identity.users.index')!.summary, 'Second');
	});

	test('exposes every registered doc', ({ assert }) => {
		registerApiDoc('a.b.c', { summary: 'A' });
		registerApiDoc('d.e.f', { summary: 'D' });

		const all = allApiDocs();

		assert.equal(all.size, 2);
		assert.exists(all.get('a.b.c'));
		assert.exists(all.get('d.e.f'));
	});

	test('clears every registered doc', ({ assert }) => {
		registerApiDoc('a.b.c', { summary: 'A' });

		clearApiDocs();

		assert.isUndefined(getApiDoc('a.b.c'));
		assert.equal(allApiDocs().size, 0);
	});
});
