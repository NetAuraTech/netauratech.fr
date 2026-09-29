import { test } from '@japa/runner';
import { NavRegistry } from '#core/services/nav_registry';
import type { AdminNavEntry } from '#core/types/nav';

const entry: AdminNavEntry = {
	label: 'admin.users.value',
	icon: 'Users',
	route: 'admin.identity.users.render',
	permission: 'users.view',
	category: 'access_control',
};

test.group('NavRegistry', () => {
	test('entries() is empty on a fresh registry', ({ assert }) => {
		const registry = new NavRegistry();

		assert.deepEqual(registry.entries(), []);
	});

	test('entries() lists registered domains in registration order', ({ assert }) => {
		const registry = new NavRegistry();

		registry.register('identity', [entry]);
		registry.register('file', [{ ...entry, route: 'admin.file.files.render' }]);

		assert.deepEqual(
			registry.entries().map(([domain]) => domain),
			['identity', 'file'],
		);
	});

	test('registering the same domain twice replaces its previous entries', ({ assert }) => {
		const registry = new NavRegistry();

		registry.register('identity', [entry]);
		registry.register('identity', []);

		const entries = registry.entries();
		assert.lengthOf(entries, 1);
		assert.deepEqual(entries[0][1], []);
	});
});
