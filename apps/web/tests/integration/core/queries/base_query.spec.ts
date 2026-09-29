import { test } from '@japa/runner';
import { BaseQuery } from '#core/queries/base_query';
import { transactionContext } from '#core/services/transaction_context';

/**
 * Concrete subclass of BaseQuery for testing purposes.
 * Exposes the protected client() and toPaginated() methods so we can assert on them.
 */
class TestableQuery extends BaseQuery {
	exposeClient() {
		return this.client();
	}

	exposeToPaginated<M, E>(result: { all(): M[]; total: number; getMeta(): Record<string, any> }, map: (row: M) => E) {
		return this.toPaginated(result, map);
	}
}

test.group('BaseQuery', () => {
	test('client() returns undefined when no transaction context is active', ({ assert }) => {
		const query = new TestableQuery();
		assert.isUndefined(query.exposeClient());
	});

	test('client() returns { client: trx } when transaction context is active', async ({ assert }) => {
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

		const query = new TestableQuery();

		const result = await transactionContext.run(mockTrx, async () => {
			return query.exposeClient();
		});

		assert.deepEqual(result, { client: mockTrx });
	});

	test('toPaginated() maps rows and preserves the pagination metadata', ({ assert }) => {
		const query = new TestableQuery();
		const rows = [
			{ id: 1, label: 'a' },
			{ id: 2, label: 'b' },
		];
		const paginator = {
			all: () => rows,
			total: 2,
			getMeta: () => ({ page: 1, perPage: 20, total: 2, lastPage: 1 }),
		};

		const result = query.exposeToPaginated(paginator, (row) => row.label.toUpperCase());

		assert.equal(result.total, 2);
		assert.deepEqual(result.all(), ['A', 'B']);
		assert.deepEqual(result.getMeta(), { page: 1, perPage: 20, total: 2, lastPage: 1 });
	});

	test('toPaginated() maps an empty page', ({ assert }) => {
		const query = new TestableQuery();
		const paginator = {
			all: () => [],
			total: 0,
			getMeta: () => ({ page: 1, perPage: 20, total: 0, lastPage: 1 }),
		};

		const result = query.exposeToPaginated(paginator, (row: any) => row);

		assert.equal(result.total, 0);
		assert.deepEqual(result.all(), []);
		assert.deepEqual(result.getMeta(), { page: 1, perPage: 20, total: 0, lastPage: 1 });
	});
});
