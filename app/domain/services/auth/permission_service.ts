import { inject } from '@adonisjs/core'
import { LogService } from '#services/logging/log_service'
import { PaginationService } from '#services/pagination/pagination_service'
import { PaginationFilters } from '#types/pagination'
import Permission from '#models/auth/permission'

interface ListFilters {
  /** Optional search term matched against `name` and `description`. */
  search?: string
}

/**
 * Provides read access to the permissions catalogue.
 *
 * Permissions are managed at the database level and are not created or
 * deleted through application code — this service exposes listing helpers
 * only.
 */
@inject()
export class PermissionService {
  constructor(
    protected logService: LogService,
    private paginationService: PaginationService
  ) {}

  /**
   * Returns every permission in the system, ordered alphabetically by name.
   *
   * Intended for use in admin UIs that need the full list in memory (e.g. a
   * role-assignment form).
   *
   * @returns An array of all {@link Permission} records.
   */
  async findAll(): Promise<Permission[]> {
    return Permission.query().orderBy('name', 'asc')
  }

  /**
   * Returns a paginated, optionally filtered list of permissions.
   *
   * When `search` is provided, results are narrowed to permissions whose
   * `name` or `description` contains the search term (case-insensitive).
   *
   * @param filters - Optional search filters.
   * @param pagination - Page number, page size, and ordering options.
   * @returns A paginated result set of {@link Permission} records.
   */
  async list(filters: ListFilters, pagination: PaginationFilters) {
    return this.paginationService.paginate({
      query: Permission.query().orderBy('name', 'asc'),
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
