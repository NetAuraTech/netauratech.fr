import { inject } from '@adonisjs/core'
import User from '#models/auth/user'
import { TOKEN_TYPES } from '#types/core'
import { DateTime } from 'luxon'
import { PaginationFilters } from '#types/pagination'
import { UserRepository } from '#repositories/auth/user_repository'

interface ListUsersPayload {
  search?: string
  role?: string
  pagination: PaginationFilters
}

/**
 * List users with optional search and role filters, including pending invitations.
 */
@inject()
export class ListUsersAction {
  constructor(protected userRepository: UserRepository) {}

  /**
   * Execute user listing.
   *
   * @param payload - Optional search term, role filter, and pagination parameters.
   * @returns A paginated result set of users with role and pending tokens preloaded.
   *
   * @example
   * const result = await listUsersAction.execute({ search: "john", pagination: { page: 1, perPage: 20 } })
   */
  async execute(payload: ListUsersPayload) {
    const query = User.query()
      .preload('role')
      .preload('tokens', (q) => {
        q.where('type', TOKEN_TYPES.PENDING_INVITE).where('expires_at', '>', DateTime.now().toSQL())
      })
      .orderBy('created_at', 'desc')

    if (payload.search) {
      query.where((builder) => {
        builder
          .whereILike('email', `%${payload.search}%`)
          .orWhereILike('username', `%${payload.search}%`)
      })
    }

    if (payload.role) {
      query.where('role_id', payload.role)
    }

    return query.paginate(payload.pagination.page ?? 1, payload.pagination.perPage ?? 20)
  }
}
