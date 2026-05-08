import { type HttpContext } from '@adonisjs/core/http'
import { DEFAULT_PAGINATION, type PaginationFilters } from '#types/pagination'

/**
 * Extracts pagination parameters from the request without schema validation.
 *
 * Prefer this helper over {@link extractPagination} for internal or trusted
 * contexts where the overhead of Vine validation is not needed (e.g. server-side
 * calls, CLI commands, or routes behind an admin guard).
 *
 * Input is sanitised with lightweight numeric guards:
 * - Non-numeric values coerced by `Number()` fall back to `defaults` or
 *   {@link DEFAULT_PAGINATION}.
 * - `page` is clamped to a minimum of `1`.
 * - `perPage` is clamped between `1` and `100` inclusive.
 *
 * @param request  - The AdonisJS HTTP request object, used to read `page` and
 *                   `perPage` from the query string or request body.
 * @param defaults - Optional overrides for the fallback values. Merged on top
 *                   of {@link DEFAULT_PAGINATION}, so partial objects are fine.
 *
 * @returns A {@link PaginationFilters} object with both `page` and `perPage`
 *          guaranteed to be defined, synchronously.
 *
 * @example
 * ```ts
 * // Controller — no await needed
 * const pagination = getPaginationParams(request)
 * return PaginationService.paginate({ query: Role.query(), filters: pagination })
 * ```
 *
 * @example
 * ```ts
 * // With a custom default page size
 * const pagination = getPaginationParams(request, { perPage: 5 })
 * ```
 */
export function getPaginationParams(
  request: HttpContext['request'],
  defaults: { page?: number; perPage?: number } = DEFAULT_PAGINATION
): PaginationFilters {
  const page = Number(request.input('page')) || defaults.page || DEFAULT_PAGINATION.page
  const perPage = Number(request.input('perPage')) || defaults.perPage || DEFAULT_PAGINATION.perPage

  return {
    page: Math.max(1, page),
    perPage: Math.min(100, Math.max(1, perPage)),
  }
}
