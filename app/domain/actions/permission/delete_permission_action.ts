import { inject } from '@adonisjs/core'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import SystemPermissionImmutableException from '#exceptions/auth/system_permission_immutable_exception'
import Permission from '#models/auth/permission'
import { PermissionRepository } from '#repositories/auth/permission_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface DeletePermissionPayload {
  id: number
}

/**
 * Delete a custom permission. Pivot rows in `role_permission` are removed by
 * the database `ON DELETE CASCADE` on the pivot foreign key.
 */
@inject()
export class DeletePermissionAction {
  constructor(protected permissionRepository: PermissionRepository) {}

  /**
   * Execute permission deletion.
   *
   * @param payload - The permission id to delete.
   * @returns `true` when the permission is deleted successfully.
   * @throws {RowNotFoundException} When the permission does not exist.
   * @throws {SystemPermissionImmutableException} When the permission is a system permission.
   *
   * @example
   * await deletePermissionAction.execute({ id: 42 })
   */
  async execute(payload: DeletePermissionPayload): Promise<boolean> {
    const permission = await this.permissionRepository.findById(payload.id)

    if (!permission) {
      throw new RowNotFoundException(Permission)
    }

    if (permission.isSystem) {
      throw new SystemPermissionImmutableException(permission.slug)
    }

    return withTransaction(async () => this.permissionRepository.delete(payload.id))
  }
}
