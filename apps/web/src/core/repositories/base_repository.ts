import { transactionContext } from '#core/services/transaction_context';

/**
 * Base class for all repositories providing transaction-aware query client resolution.
 *
 * Every repository inherits the `client()` protected method so that Lucid queries
 * automatically run inside the ambient transaction when one is active. Subclasses
 * call `this.client()` on `.query()` / `.create()` — they never import
 * `transactionContext` themselves.
 */
export abstract class BaseRepository {
	/** Resolve the active database client, preferring an ambient transaction if one exists. */
	protected client() {
		const trx = transactionContext.get();
		return trx ? { client: trx } : undefined;
	}
}
