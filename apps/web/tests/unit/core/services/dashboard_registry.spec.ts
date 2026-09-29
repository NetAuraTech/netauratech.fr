import { test } from '@japa/runner';
import { DashboardRegistry } from '#core/services/dashboard_registry';
import type { DashboardCollector, DashboardCollectorPayload } from '#core/types/dashboard';

const payload: DashboardCollectorPayload = { recentLimit: 5 };

test.group('DashboardRegistry', () => {
	test('entries() is empty on a fresh registry', ({ assert }) => {
		const registry = new DashboardRegistry();

		assert.deepEqual(registry.entries(), []);
	});

	test('entries() lists registered sections in registration order', ({ assert }) => {
		const registry = new DashboardRegistry();
		const collector: DashboardCollector<'identity'> = {
			collect: async () => ({ users: 0, usersByRole: [] }),
		};
		const fileCollector: DashboardCollector<'file'> = {
			collect: async () => ({ files: 0, fileFolders: 0, filesByFolder: [], recentFiles: [] }),
		};

		registry.register('identity', async () => collector);
		registry.register('file', async () => fileCollector);

		assert.deepEqual(
			registry.entries().map(([section]) => section),
			['identity', 'file'],
		);
	});

	test('register() does not invoke the factory', async ({ assert }) => {
		const registry = new DashboardRegistry();
		let invoked = false;

		registry.register('identity', async () => {
			invoked = true;
			return { collect: async () => ({ users: 0, usersByRole: [] }) };
		});

		assert.isFalse(invoked);
	});

	test('registering the same section twice replaces the previous factory', async ({ assert }) => {
		const registry = new DashboardRegistry();
		const replacement: DashboardCollector<'identity'> = {
			collect: async () => ({ users: 42, usersByRole: [] }),
		};

		registry.register('identity', async () => ({
			collect: async () => ({ users: 0, usersByRole: [] }),
		}));
		registry.register('identity', async () => replacement);

		const entries = registry.entries();
		assert.lengthOf(entries, 1);
		const factory = entries[0][1];
		const collector = await factory();
		assert.deepEqual(await collector.collect(payload), { users: 42, usersByRole: [] });
	});

	test('getTranslationBuilders() is empty on a fresh registry', ({ assert }) => {
		const registry = new DashboardRegistry();

		assert.deepEqual(registry.getTranslationBuilders(), []);
	});

	test('registerTranslations() accumulates builders in registration order', ({ assert }) => {
		const registry = new DashboardRegistry();
		const builderA = (_i18n: unknown) => ({ a: 'A' });
		const builderB = (_i18n: unknown) => ({ b: 'B' });

		registry.registerTranslations(builderA);
		registry.registerTranslations(builderB);

		const builders = registry.getTranslationBuilders();
		assert.lengthOf(builders, 2);
		assert.deepEqual(builders[0]({} as unknown as import('#core/contracts/i18n_translator').I18nTranslator), {
			a: 'A',
		});
		assert.deepEqual(builders[1]({} as unknown as import('#core/contracts/i18n_translator').I18nTranslator), {
			b: 'B',
		});
	});
});
