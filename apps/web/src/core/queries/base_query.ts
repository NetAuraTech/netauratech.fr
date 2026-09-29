import { transactionContext } from '#core/services/transaction_context';

/**
 * Read-side pagination result hydrated to domain entities.
 *
 * Carries the surface of the Lucid paginator that callers consume — the
 * domain-hydrated rows plus the raw pagination metadata — while keeping raw
 * Lucid models from leaking across the query boundary.
 */
export interface PaginatedResult<T> {
	/** Total number of matching rows. */
	readonly total: number;
	/** The domain-hydrated rows of the current page. */
	all(): T[];
	/** The raw Lucid pagination metadata (page, perPage, lastPage, …). */
	getMeta(): Record<string, any>;
}

/**
 * Base class for database-backed read-side queries, providing
 * transaction-aware query client resolution.
 *
 * Mirrors the repository base on the write side: every query inherits the
 * `client()` protected method so that Lucid queries automatically run inside
 * the ambient transaction when one is active. Subclasses call `this.client()`
 * on `.query()` — they never import `transactionContext` themselves.
 */
export abstract class BaseQuery {
	/** Resolve the active database client, preferring an ambient transaction if one exists. */
	protected client() {
		const trx = transactionContext.get();
		return trx ? { client: trx } : undefined;
	}

	/**
	 * Project a Lucid pagination result onto domain entities, preserving the
	 * pagination metadata.
	 *
	 * @param result - The paginator returned by Lucid's `paginate()`.
	 * @param map - The hydration of a single row, typically `row.toDomain()`.
	 * @returns A {@link PaginatedResult} whose rows are domain entities.
	 */
	protected toPaginated<M, E>(
		result: { all(): M[]; total: number; getMeta(): Record<string, any> },
		map: (row: M) => E,
	): PaginatedResult<E> {
		const rows = result.all().map(map);
		const meta = result.getMeta();
		const total = result.total;
		return { total, all: () => rows, getMeta: () => meta };
	}
}
