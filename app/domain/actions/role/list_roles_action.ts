import { inject } from '@adonisjs/core'
import Role from '#models/auth/role'
import { PaginationFilters } from '#types/pagination'

interface ListRolesPayload {
  search?: string
  pagination: PaginationFilters
}

/**
 * List roles with optional search filter and pagination, including permission and user counts.
 */
@inject()
export class ListRolesAction {
  /**
   * Execute role listing.
   *
   * @param payload - Optional search term and pagination parameters.
   * @returns A paginated result set of roles with permissions preloaded and user count.
   *
   * @example
   * const result = await listRolesAction.execute({ search: 'admin', pagination: { page: 1, perPage: 20 } })
   */
  async execute(payload: ListRolesPayload) {
    const query = Role.query().preload('permissions').withCount('users').orderBy('name', 'asc')

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
