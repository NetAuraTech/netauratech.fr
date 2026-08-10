import { inject } from '@adonisjs/core'
import Permission from '#models/auth/permission'
import { PermissionRepository } from '#repositories/auth/permission_repository'

/**
 * List all permissions sorted alphabetically. Read-only operation.
 */
@inject()
export class ListAllPermissionsAction {
  constructor(protected permissionRepository: PermissionRepository) {}

  /**
   * Execute permission listing.
   *
   * @returns An array of all {@link Permission} records sorted by name.
   *
   * @example
   * const permissions = await listAllPermissionsAction.execute()
   */
  async execute(): Promise<Permission[]> {
    return this.permissionRepository.findAll({ orderBy: 'name' })
  }
}
