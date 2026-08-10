import { inject } from '@adonisjs/core'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import Role from '#models/auth/role'

interface GetRoleDetailPayload {
  id: number
}

/**
 * Fetch a single role with its permissions and assigned users preloaded.
 */
@inject()
export class GetRoleDetailAction {
  /**
   * Execute role detail lookup.
   *
   * @param payload - The role id to fetch.
   * @returns The role with `permissions` and `users` relations loaded.
   * @throws {RowNotFoundException} When the role does not exist.
   *
   * @example
   * const role = await getRoleDetailAction.execute({ id: 1 })
   */
  async execute(payload: GetRoleDetailPayload): Promise<Role> {
    const role = await Role.query()
      .where('id', payload.id)
      .preload('permissions')
      .preload('users')
      .first()

    if (!role) {
      throw new RowNotFoundException(Role)
    }

    return role
  }
}
