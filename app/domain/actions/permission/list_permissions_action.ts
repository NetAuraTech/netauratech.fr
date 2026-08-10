import { inject } from '@adonisjs/core'
import Permission from '#models/auth/permission'
import { PaginationFilters } from '#types/pagination'

interface ListPermissionsPayload {
  search?: string
  pagination: PaginationFilters
}

/**
 * List permissions with optional search filter and pagination.
 */
@inject()
export class ListPermissionsAction {
  /**
   * Execute permission listing.
   *
   * @param payload - Optional search term and pagination parameters.
   * @returns A paginated result set of permissions.
   *
   * @example
   * const result = await listPermissionsAction.execute({ search: 'user', pagination: { page: 1, perPage: 20 } })
   */
  async execute(payload: ListPermissionsPayload) {
    const query = Permission.query().orderBy('name', 'asc')

    if (payload.search) {
      query.where((builder) => {
        builder
          .whereILike('name', `%${payload.search}%`)
          .orWhereILike('description', `%${payload.search}%`)
      })
    }

    return query.paginate(payload.pagination.page ?? 1, payload.pagination.perPage ?? 20)
  }
}
