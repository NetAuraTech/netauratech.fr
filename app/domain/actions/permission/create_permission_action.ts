import { inject } from '@adonisjs/core'
import SlugExistsException from '#exceptions/core/slug_exists_exception'
import Permission from '#models/auth/permission'
import { PermissionRepository } from '#repositories/auth/permission_repository'
import { withTransaction } from '#shared/utils/with_transaction'

interface CreatePermissionPayload {
  name: string
  slug: string
  category: string
  description: string | null
}

/**
 * Create a custom permission.
 */
@inject()
export class CreatePermissionAction {
  constructor(protected permissionRepository: PermissionRepository) {}

  /**
   * Execute permission creation.
   *
   * @param payload - The permission attributes.
   * @returns The newly created permission.
   * @throws {SlugExistsException} When another permission already uses the slug.
   *
   * @example
   * const permission = await createPermissionAction.execute({
   *   name: 'Publish articles',
   *   slug: 'articles.publish',
   *   category: 'articles',
   *   description: null,
   * })
   */
  async execute(payload: CreatePermissionPayload): Promise<Permission> {
    const existing = await this.permissionRepository.findBySlug(payload.slug)

    if (existing) {
      throw new SlugExistsException(payload.slug)
    }

    return withTransaction(async () =>
      this.permissionRepository.create({
        name: payload.name,
        slug: payload.slug,
        category: payload.category,
        description: payload.description,
        isSystem: false,
      })
    )
  }
}
