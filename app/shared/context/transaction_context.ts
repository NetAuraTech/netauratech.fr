import { AsyncLocalStorage } from 'node:async_hooks'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

/**
 * Holds the active database transaction in an async-local context so that
 * deep call stacks can access it without explicit parameter threading.
 */
export class TransactionContext {
  #storage = new AsyncLocalStorage<TransactionClientContract>()

  public run<T>(trx: TransactionClientContract, callback: () => Promise<T>): Promise<T> {
    return this.#storage.run(trx, callback)
  }

  public get(): TransactionClientContract | undefined {
    return this.#storage.getStore()
  }

  public getOrFail(): TransactionClientContract {
    const trx = this.get()
    if (!trx) {
      throw new Error('No active transaction found in the current async context.')
    }
    return trx
  }

  /**
   * Persist a model's dirty attributes within the active transaction using
   * a direct UPDATE statement, so that models loaded outside the transaction
   * scope are still saved atomically.
   *
   * Has no effect when called outside a transaction context or when the
   * model has no dirty attributes.
   *
   * @param model - The Lucid model instance whose changes should be flushed.
   */
  public async merge(model: object): Promise<void> {
    const trx = this.get()
    if (!trx) return

    const m = model as Record<string, unknown>
    const dirty = m.$dirty as string[] | undefined
    const attributes = m.$attributes as Record<string, unknown> | undefined
    const primaryKeyCol = m.$primaryKey as string | undefined
    const tableName = m.$tableName as string | undefined

    if (!dirty || !attributes || !primaryKeyCol || !tableName) return
    if (Object.keys(dirty).length === 0) return

    const updates: Record<string, unknown> = {}
    for (const key of dirty) {
      updates[key] = attributes[key]
    }

    await (trx as any)
      .table(tableName)
      .where(primaryKeyCol, attributes[primaryKeyCol])
      .update(updates)
  }
}

export const transactionContext = new TransactionContext()
