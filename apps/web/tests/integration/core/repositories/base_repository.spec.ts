import { test } from '@japa/runner';
import { BaseRepository } from '#core/repositories/base_repository';
import { transactionContext } from '#core/services/transaction_context';

/**
 * Concrete subclass of BaseRepository for testing purposes.
 * Exposes the protected client() method so we can assert on it.
 */
class TestableRepository extends BaseRepository {
	exposeClient() {
		return this.client();
	}
}

test.group('BaseRepository', () => {
	test('client() returns undefined when no transaction context is active', ({ assert }) => {
		const repo = new TestableRepository();
		assert.isUndefined(repo.exposeClient());
	});

	test('client() returns { client: trx } when transaction context is active', async ({ assert, cleanup }) => {
		cleanup(() => {
			// Clear any lingering context after the test
		});

		const mockTrx = {
			id: 'test-trx',
			query: async () => [],
			table: () => ({
				where: () => ({ update: async () => {} }),
				insert: async () => {},
			}),
			transaction: async () => mockTrx,
			commit: async () => {},
			rollback: async () => {},
		} as any;

		const repo = new TestableRepository();

		const result = await transactionContext.run(mockTrx, async () => {
			return repo.exposeClient();
		});

		assert.deepEqual(result, { client: mockTrx });
	});
});
