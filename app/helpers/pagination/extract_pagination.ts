import { type HttpContext } from '@adonisjs/core/http'
import { DEFAULT_PAGINATION, type PaginationFilters } from '#types/pagination'
import { paginationValidator } from '#validators/pagination'

/**
 * Extracts and validates pagination parameters from the request using a Vine schema.
 *
 * Prefer this helper over {@link getPaginationParams} whenever input validation
 * matters — e.g. in controllers where the client data should not be trusted.
 * Invalid values are rejected by Vine before any fallback logic runs.
 *
 * **Fallback chain** (first truthy value wins):
 * `request input → defaults argument → {@link DEFAULT_PAGINATION}`
 *
 * @param request  - The AdonisJS HTTP request object, used to read `page` and
 *                   `perPage` from the query string or request body.
 * @param defaults - Optional overrides for the fallback values. Merged on top
 *                   of {@link DEFAULT_PAGINATION}, so partial objects are fine.
 *
 * @returns A `Promise` resolving to a {@link PaginationFilters} object with
 *          both `page` and `perPage` guaranteed to be defined.
 *
 * @throws {ValidationException} When Vine rejects the input (e.g. non-numeric
 *         values, negative numbers, or any constraint defined in `paginationSchema`).
 *
 * @example
 * ```ts
 * // Controller — with custom perPage default
 * const pagination = await extractPagination(request, { perPage: 50 })
 * return PaginationService.paginate({ query: User.query(), filters: pagination })
 * ```
 */
export async function extractPagination(
  request: HttpContext['request'],
  defaults: { page?: number; perPage?: number } = DEFAULT_PAGINATION
): Promise<PaginationFilters> {
  const payload = await paginationValidator.validate(request.only(['page', 'perPage']))

  return {
    page: payload.page ?? defaults.page ?? DEFAULT_PAGINATION.page,
    perPage: payload.perPage ?? defaults.perPage ?? DEFAULT_PAGINATION.perPage,
  }
}
