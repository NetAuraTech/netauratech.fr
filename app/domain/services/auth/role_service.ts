import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { PaginationService } from '#services/pagination/pagination_service'
import { PaginationFilters } from '#types/pagination'
import Role from '#models/auth/role'

interface ListFilters {
  /** Optional search term matched against `name` and `description`. */
  search?: string
}

/**
 * Provides read access to the roles catalogue.
 *
 * Roles are managed at the database level and are not created or deleted
 * through application code — this service exposes listing helpers only.
 */
@inject()
export class RoleService {
  constructor(
    protected logService: LogService,
    private paginationService: PaginationService
  ) {}

  /**
   * Returns every role in the system, ordered alphabetically by name.
   *
   * Intended for use in admin UIs that need the full list in memory (e.g. a
   * user-assignment form).
   *
   * @returns An array of all {@link Role} records.
   */
  async findAll(): Promise<Role[]> {
    return Role.query().orderBy('name', 'asc')
  }

  /**
   * Returns a paginated, optionally filtered list of roles.
   *
   * Each role is eager-loaded with its permissions and annotated with the
   * count of users currently assigned to it. When `search` is provided,
   * results are narrowed to roles whose `name` or `description` contains the
   * search term (case-insensitive).
   *
   * @param filters - Optional search filters.
   * @param pagination - Page number, page size, and ordering options.
   * @returns A paginated result set of {@link Role} records, each including
   *   preloaded `permissions` and a `usersCount` aggregate.
   */
  async list(filters: ListFilters, pagination: PaginationFilters) {
    return this.paginationService.paginate({
      query: Role.query().preload('permissions').withCount('users').orderBy('name', 'asc'),
      filters: pagination,
      conditionalFilters: [
        {
          value: filters.search,
          apply: (q) =>
            q.where((builder) => {
              builder
                .whereILike('name', `%${filters.search}%`)
                .orWhereILike('description', `%${filters.search}%`)
            }),
        },
      ],
    })
  }
}
