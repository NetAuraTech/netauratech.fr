/**
 * Base pagination parameters shared by all list filter interfaces.
 *
 * Extend this interface in your own filter types to automatically
 * inherit `page` and `perPage` support:
 *
 * @example
 * ```ts
 * interface UserListFilters extends PaginationFilters {
 *   search?: string
 *   role?: number
 * }
 * ```
 */
export interface PaginationFilters {
  /**
   * The page number to retrieve (1-based).
   * Defaults to {@link DEFAULT_PAGINATION.page} when omitted.
   */
  page?: number

  /**
   * The number of records to return per page.
   * Defaults to {@link DEFAULT_PAGINATION.perPage} when omitted.
   */
  perPage?: number
}

/**
 * Default pagination values used as fallback when `page` or `perPage`
 * are not provided in the request filters.
 *
 * @property page    - The default page number (1-based).
 * @property perPage - The default number of records per page.
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  perPage: 20,
} as const

/**
 * Framework-agnostic interface for a paginated result set.
 * Mirrors the shape of Lucid's `SimplePaginatorContract` without importing
 * any internal type, ensuring the generic `T` is always correctly resolved.
 *
 * @typeParam T - The model instance type contained in the paginator.
 */
export interface PaginatedResult<T> {
  /** Returns all records on the current page. */
  all(): T[]
  /** Total number of records across all pages. */
  readonly total: number
  /** Number of records per page. */
  readonly perPage: number
  /** Current page number (1-based). */
  readonly currentPage: number
  /** Last available page number. */
  readonly lastPage: number
  /** Whether a next page exists. */
  readonly hasMorePages: boolean
  /** Whether a previous page exists. */
  readonly hasPreviousPage: boolean
  /** Serialises the paginator to a plain object (meta + data). */
  toJSON(): {
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
      firstPage: number
      firstPageUrl: string
      lastPageUrl: string
      nextPageUrl: string | null
      previousPageUrl: string | null
    }
    data: ReturnType<T extends { serialize(...args: any[]): any } ? T['serialize'] : () => T>[]
  }
}
