import db from '@adonisjs/lucid/services/db';
import { transactionContext } from '#core/services/transaction_context';

/**
 * Execute a callback within a database transaction that is automatically
 * available through the async-local {@link transactionContext}.
 *
 * The transaction is started by Lucid and bound to the current async scope,
 * so any repository or service called inside the callback can resolve it
 * without explicit parameter threading. The transaction is committed on
 * success or rolled back if the callback throws.
 *
 * @param callback - The async work that should run inside the transaction.
 * @returns The resolved value from the callback.
 *
 * @example
 * const user = await withTransaction(async () => {
 *   await userService.create(data)
 *   await profileService.initialize(user.id)
 *   return user
 * })
 */
export function withTransaction<T>(callback: () => Promise<T>): Promise<T> {
	return db.transaction((trx) => {
		return transactionContext.run(trx, callback);
	});
}
