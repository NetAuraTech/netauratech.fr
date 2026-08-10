import { inject } from '@adonisjs/core'
import Role from '#models/auth/role'
import { RoleRepository } from '#repositories/auth/role_repository'

/**
 * List all roles sorted alphabetically. Read-only operation.
 */
@inject()
export class ListAllRolesAction {
  constructor(protected roleRepository: RoleRepository) {}

  /**
   * Execute role listing.
   *
   * @returns An array of all {@link Role} records sorted by name.
   *
   * @example
   * const roles = await listAllRolesAction.execute()
   */
  async execute(): Promise<Role[]> {
    return this.roleRepository.findAll({ orderBy: 'name' })
  }
}
