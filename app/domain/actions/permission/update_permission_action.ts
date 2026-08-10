import { inject } from '@adonisjs/core'
import RowNotFoundException from '#exceptions/core/row_not_found_exception'
import SlugExistsException from '#exceptions/core/slug_exists_exception'
import SystemPermissionImmutableException from '#exceptions/auth/system_permission_immutable_exception'
import Permission from '#models/auth/permission'
import { PermissionRepository } from '#repositories/auth/permission_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface UpdatePermissionPayload {
  id: number
  name: string
  slug: string
  category: string
  description: string | null
}

/**
 * Update a custom permission.
 */
@inject()
export class UpdatePermissionAction {
  constructor(protected permissionRepository: PermissionRepository) {}

  /**
   * Execute permission update.
   *
   * @param payload - The permission id and updated attributes.
   * @returns The updated permission.
   * @throws {RowNotFoundException} When the permission does not exist.
   * @throws {SystemPermissionImmutableException} When the permission is a system permission.
   * @throws {SlugExistsException} When another permission already uses the new slug.
   *
   * @example
   * const permission = await updatePermissionAction.execute({
   *   id: 42,
   *   name: 'Publish articles',
   *   slug: 'articles.publish',
   *   category: 'articles',
   *   description: null,
   * })
   */
  async execute(payload: UpdatePermissionPayload): Promise<Permission> {
    const permission = await this.permissionRepository.findById(payload.id)

    if (!permission) {
      throw new RowNotFoundException(Permission)
    }

    if (permission.isSystem) {
      throw new SystemPermissionImmutableException(permission.slug)
    }

    if (payload.slug !== permission.slug) {
      const existing = await this.permissionRepository.findBySlug(payload.slug)
      if (existing) {
        throw new SlugExistsException(payload.slug)
      }
    }

    return withTransaction(async () =>
      this.permissionRepository.update(payload.id, {
        name: payload.name,
        slug: payload.slug,
        category: payload.category,
        description: payload.description,
      })
    ) as Promise<Permission>
  }
}
